<#
.SYNOPSIS
  Verificación de Gym Tracker antes de commitear o pushear. Exit 0 = todo verde.

.DESCRIPTION
  Corre, en orden:
    1. Docs base (existen, y CLAUDE.md respeta su presupuesto de líneas).
    2. Invariantes que los docs afirman y que se pueden chequear con un grep:
       - initializeApp() se llama UNA sola vez en el backend, en index.js.
       - Nadie arma la clave del día con toISOString() (bug de UTC-3).
       - pages/ y components/ no importan Firestore/Storage directo (salvo legacy).
    3. El backend carga (require de index.js).
    3b. Tests de firestore.rules y storage.rules en el emulador (tests/rules, necesita Java).
    4. Typecheck del frontend (tsc --noEmit).
    5. Tests del frontend (incluye la sincronía de los dos constants.js).
    6. Build de producción del frontend (se saltea con -Rapido).

  Ojo: el build corre con CI=true, que convierte los warnings de lint en errores.
  Es más estricto que GitHub Actions (que buildea con CI=false) a propósito: un
  warning permanente entrena a ignorar warnings.

.PARAMETER Rapido
  Saltea el build de producción.

.EXAMPLE
  .\verify.ps1
  .\verify.ps1 -Rapido
#>
param([switch]$Rapido)

$ErrorActionPreference = 'Continue'
$raiz = $PSScriptRoot
$frontend = Join-Path $raiz 'frontend'
$backend = Join-Path $raiz 'backend'
$testsRules = Join-Path $raiz 'tests\rules'
$fallas = New-Object System.Collections.Generic.List[string]

# Presupuesto de CLAUDE.md: entra entero en cada sesión; más largo = menos adherencia.
$PRESUPUESTO_CLAUDE_MD = 200

# Archivos que pueden importar Firestore directo por ser legacy. No agregues sin motivo.
$LEGACY_FIRESTORE_DIRECTO = @()

# Corre un paso. Convención: la acción emite "!mensaje" por cada problema que
# encuentra; cualquier otra salida (la de tsc, jest, etc.) se muestra tal cual.
# Un comando nativo con exit code distinto de 0 también cuenta como falla.
function Paso([string]$nombre, [scriptblock]$accion) {
  Write-Host ''
  Write-Host "==> $nombre" -ForegroundColor Cyan
  $global:LASTEXITCODE = 0
  $problemas = New-Object System.Collections.Generic.List[string]
  & $accion | ForEach-Object {
    $linea = "$_"
    if ($linea.StartsWith('!')) { $problemas.Add($linea.Substring(1)) } else { Write-Host $linea }
  }
  if ($LASTEXITCODE -ne 0) { $problemas.Add("el comando terminó con exit code $LASTEXITCODE") }
  if ($problemas.Count -eq 0) {
    Write-Host '    OK' -ForegroundColor Green
  } else {
    foreach ($p in $problemas) { Write-Host "    FALLA: $p" -ForegroundColor Red }
    $fallas.Add($nombre)
  }
}

# Devuelve las líneas de código (no comentarios) que matchean el patrón.
function Buscar-EnCodigo([string[]]$carpetas, [string]$patron, [string[]]$extensiones) {
  foreach ($c in $carpetas) {
    Get-ChildItem $c -Recurse -File -Include $extensiones |
      Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
      Select-String -Pattern $patron |
      Where-Object { $_.Line -notmatch '^\s*(//|\*|/\*)' }
  }
}

function Relativa([string]$ruta) { $ruta.Substring($raiz.Length + 1) }

# ── 0. Dependencias instaladas ───────────────────────────────────────────────
foreach ($d in @($frontend, $backend, $testsRules)) {
  if (-not (Test-Path (Join-Path $d 'node_modules'))) {
    Write-Host "Falta $(Relativa $d)\node_modules. Corré 'npm install' ahí y volvé a intentar." -ForegroundColor Red
    exit 1
  }
}

# ── 1. Docs base ─────────────────────────────────────────────────────────────
Paso 'Docs base' {
  foreach ($doc in @('CLAUDE.md', 'context.md', 'protocol.md', 'ESTADO.md', 'worklog\README.md')) {
    if (-not (Test-Path (Join-Path $raiz $doc))) { "!falta $doc" }
  }
  # Ojo: Measure-Object -Line NO cuenta las líneas vacías y subestima. Contamos todas.
  $lineas = @(Get-Content (Join-Path $raiz 'CLAUDE.md')).Count
  if ($lineas -gt $PRESUPUESTO_CLAUDE_MD) {
    "!CLAUDE.md tiene $lineas líneas (presupuesto: $PRESUPUESTO_CLAUDE_MD). No subas el techo: mové lo que no sea regla durable a ESTADO.md, .claude/rules/ o una skill."
  }
}

# ── 2. Invariantes ───────────────────────────────────────────────────────────
Paso 'initializeApp() una sola vez, en backend/src/index.js' {
  $llamadas = @(Buscar-EnCodigo @("$backend\src") 'initializeApp\s*\(' @('*.js'))
  if ($llamadas.Count -ne 1 -or $llamadas[0].Path -notlike '*\src\index.js') {
    "!se esperaba 1 llamada en index.js y hay $($llamadas.Count):"
    foreach ($l in $llamadas) { "!  $(Relativa $l.Path):$($l.LineNumber)" }
  }
}

Paso 'Sin toISOString() para la clave del día (usar utils/date.ts)' {
  $patron = 'toISOString\(\)\s*\.\s*(split\(\s*[''"]T[''"]|slice\(\s*0\s*,\s*10|substr(ing)?\(\s*0\s*,\s*10)'
  foreach ($l in @(Buscar-EnCodigo @("$frontend\src", "$backend\src") $patron @('*.ts', '*.tsx', '*.js'))) {
    "!$(Relativa $l.Path):$($l.LineNumber) → usá formatDateLocal()"
  }
}

Paso 'pages/ y components/ no importan Firestore/Storage directo' {
  $patron = 'from\s+[''"]firebase/(firestore|storage)[''"]'
  foreach ($l in @(Buscar-EnCodigo @("$frontend\src\pages", "$frontend\src\components") $patron @('*.ts', '*.tsx'))) {
    if ($LEGACY_FIRESTORE_DIRECTO -notcontains (Split-Path $l.Path -Leaf)) {
      "!$(Relativa $l.Path):$($l.LineNumber) → el acceso a datos va en services/"
    }
  }
}

Paso 'SweetAlert solo vía config/alertas.ts (popups con la identidad y sin HTML)' {
  $patron = 'from\s+[''"]sweetalert2[''"]'
  foreach ($l in @(Buscar-EnCodigo @("$frontend\src") $patron @('*.ts', '*.tsx'))) {
    if ((Split-Path $l.Path -Leaf) -ne 'alertas.ts') {
      "!$(Relativa $l.Path):$($l.LineNumber) → usá Alerta de config/alertas.ts"
    }
  }
}

# ── 3. Backend carga ─────────────────────────────────────────────────────────
Paso 'El backend carga (require de index.js)' {
  Push-Location $backend
  try { node -e "require('./src/index.js')" } finally { Pop-Location }
}

# ── 3b. Rules en el emulador ─────────────────────────────────────────────────
# El emulador de Firestore necesita Java. Si no está en el PATH, se busca el JDK
# de Microsoft (winget install Microsoft.OpenJDK.21). Proyecto demo-*: nunca
# toca producción.
Paso 'Tests de rules (emulador de Firestore + Storage)' {
  if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    $jdk = Get-ChildItem 'C:\Program Files\Microsoft' -Directory -Filter 'jdk-*' -ErrorAction SilentlyContinue |
      Sort-Object Name -Descending | Select-Object -First 1
    if (-not $jdk) {
      '!falta Java para el emulador: winget install Microsoft.OpenJDK.21'
      return
    }
    $env:JAVA_HOME = $jdk.FullName
    $env:Path = "$($jdk.FullName)\bin;$env:Path"
  }
  Push-Location $testsRules
  try {
    # Solo el resumen: el emulador loguea cada PERMISSION_DENIED esperado.
    $salida = npm test 2>&1 | ForEach-Object { "$_" }
    $codigo = $LASTEXITCODE
    $salida | Where-Object { $_ -match '^\s*(✖|ℹ (tests|pass|fail))' }
    if ($codigo -ne 0) {
      # Indentado: Firebase imprime líneas que empiezan con "!" y Paso las tomaría como fallas.
      $salida | Select-Object -Last 40 | ForEach-Object { "    $_" }
      "!los tests de rules fallaron (arriba, el final de la salida)"
    }
    $global:LASTEXITCODE = 0
  } finally { Pop-Location }
}

# ── 4-6. Frontend ────────────────────────────────────────────────────────────
Push-Location $frontend
$ciAnterior = $env:CI
try {
  $env:CI = 'true'
  Paso 'Typecheck (tsc --noEmit)' { npx tsc --noEmit }
  Paso 'Tests (Jest)' { npx react-scripts test --watchAll=false }
  if ($Rapido) {
    Write-Host ''
    Write-Host '==> Build de producción: SALTEADO (-Rapido)' -ForegroundColor Yellow
  } else {
    Paso 'Build de producción (CI=true: warnings = errores)' { npm run build }
  }
} finally {
  $env:CI = $ciAnterior
  Pop-Location
}

# ── Resultado ────────────────────────────────────────────────────────────────
Write-Host ''
if ($fallas.Count -eq 0) {
  Write-Host 'VERIFICACIÓN EN VERDE' -ForegroundColor Green
  exit 0
}
Write-Host "VERIFICACIÓN EN ROJO — fallaron $($fallas.Count) paso(s):" -ForegroundColor Red
foreach ($f in $fallas) { Write-Host "  - $f" -ForegroundColor Red }
exit 1
