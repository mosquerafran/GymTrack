import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import SelectorMusculos from "./SelectorMusculos";
import MiniCuerpo from "./MiniCuerpo";
import StatsMusculos from "../StatsMusculos";
import { Musculo } from "../../config/entrenos";

// Humo de render: los componentes del cuerpo montan con los dos modelos y responden al toque.

describe("SelectorMusculos", () => {
  test.each(["hombre", "mujer"] as const)("modelo %s: tocar un músculo y tildar la lista avisan el cambio", (sexo) => {
    const onChange = jest.fn();
    render(<SelectorMusculos sexo={sexo} seleccion={new Set<Musculo>()} onChange={onChange} />);

    // Tocar el pecho en la figura (hay un path por lado del cuerpo: se toma el primero).
    fireEvent.click(screen.getAllByRole("button", { name: "Pecho" })[0]);
    expect(onChange).toHaveBeenLastCalledWith(new Set(["pecho"]));

    // La misma selección, desde la lista de checkboxes.
    fireEvent.click(screen.getByRole("button", { name: /ver lista de músculos/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Gemelos" }));
    expect(onChange).toHaveBeenLastCalledWith(new Set(["gemelos"]));
  });

  test("un atajo suma sus músculos y sugiere la etiqueta", () => {
    const onChange = jest.fn();
    const onAtajo = jest.fn();
    render(<SelectorMusculos sexo="hombre" seleccion={new Set<Musculo>(["biceps"])} onChange={onChange} onAtajo={onAtajo} />);
    fireEvent.click(screen.getByRole("button", { name: "Push" }));
    expect(onChange).toHaveBeenLastCalledWith(new Set(["biceps", "pecho", "hombros", "triceps"]));
    expect(onAtajo).toHaveBeenCalledWith("Push");
  });

  test("muestra el resumen de lo elegido", () => {
    render(<SelectorMusculos sexo="hombre" seleccion={new Set<Musculo>(["triceps", "pecho"])} onChange={() => {}} />);
    expect(screen.getByText("Pecho · Tríceps")).toBeInTheDocument();
    expect(screen.getByText("2 elegidos")).toBeInTheDocument();
  });
});

test("MiniCuerpo describe los músculos para lectores de pantalla", () => {
  render(<MiniCuerpo sexo="mujer" musculos={["pecho", "hombros"]} />);
  expect(screen.getByRole("img", { name: "Músculos: Pecho, Hombros" })).toBeInTheDocument();
});

describe("StatsMusculos", () => {
  const props = {
    sexo: "hombre" as const,
    porMusculo: { pecho: 8, cuadriceps: 1 },
    umbral: [1, 3, 6] as [number, number, number],
    ultimaVez: { pecho: "2000-01-01" },
    tren: { superior: 8, inferior: 1 },
    lideres: [{ zona: "Pecho", nombre: "Fran", dias: 8 }],
    rangoTexto: "septiembre",
    miNombre: "Fran",
  };

  test("tocar un músculo del mapa muestra sus días", () => {
    render(<StatsMusculos {...props} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Pecho: 8 días" })[0]);
    expect(screen.getByText("Pecho", { selector: "b" })).toBeInTheDocument();
    expect(screen.getByText(/8 días · última vez hace/)).toBeInTheDocument();
  });

  test("arriba vs. abajo, olvidados y reyes", () => {
    render(<StatsMusculos {...props} />);
    expect(screen.getByText("Entrenás arriba 8,0 veces lo que abajo.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Músculos olvidados" })).toBeInTheDocument();
    expect(screen.getByText("Fran (vos)")).toBeInTheDocument();
  });
});
