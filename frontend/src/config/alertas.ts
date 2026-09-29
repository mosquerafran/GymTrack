import Swal from "sweetalert2";

/**
 * SweetAlert con la identidad "Hierro Forjado". Usá SIEMPRE esto en vez de `Swal` directo:
 * los colores salen de las clases de Tailwind (siguen al tema claro/oscuro) y los botones
 * son los de la app (≥ 44 px). Los textos van con `titleText`/`text` (no `title`/`html`)
 * para no interpretar HTML que venga de datos del usuario.
 */
export const Alerta = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  customClass: {
    popup: "!bg-surface !text-textMain !rounded-3xl !border !border-borderBase !shadow-premium",
    title: "!font-display !uppercase !tracking-wide !text-textMain",
    htmlContainer: "!text-textMuted !text-base",
    actions: "!gap-2 !w-full !px-4",
    confirmButton: "btn-primary min-h-[48px] px-6 flex-1",
    cancelButton: "btn-secondary min-h-[48px] px-6 flex-1",
    denyButton: "btn-secondary min-h-[48px] px-6 flex-1",
  },
});
