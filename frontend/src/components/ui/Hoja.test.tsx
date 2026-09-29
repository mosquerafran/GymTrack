import React, { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import Hoja from "./Hoja";

// "Atrás" del celu = popstate. jsdom implementa history, pero back() es asíncrono:
// se simula el popstate con el estado anterior, que es lo que dispara el navegador.
const atras = (estadoAnterior: unknown) =>
  act(() => { window.dispatchEvent(new PopStateEvent("popstate", { state: estadoAnterior })); });

function Dos() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <>
      <Hoja abierta={a} onCerrar={() => setA(false)} titulo="Detalle">
        <button type="button" onClick={() => setB(true)}>Editar</button>
      </Hoja>
      <Hoja abierta={b} onCerrar={() => setB(false)} titulo="Editar entreno">
        <p>formulario</p>
      </Hoja>
    </>
  );
}

beforeEach(() => window.history.replaceState({ vista: "home", hojas: [] }, ""));

test("abre como diálogo accesible y cierra con la X", () => {
  const onCerrar = jest.fn();
  render(<Hoja abierta onCerrar={onCerrar} titulo="Detalle"><p>hola</p></Hoja>);
  expect(screen.getByRole("dialog", { name: "Detalle" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
  expect(onCerrar).toHaveBeenCalled();
});

test("'atrás' cierra la hoja en vez de salir de la app", () => {
  const onCerrar = jest.fn();
  render(<Hoja abierta onCerrar={onCerrar} titulo="Detalle"><p>hola</p></Hoja>);
  expect(window.history.state.hojas).toHaveLength(1); // abrir agregó una entrada
  atras({ vista: "home", hojas: [] });
  expect(onCerrar).toHaveBeenCalled();
});

test("con dos hojas apiladas, 'atrás' y Escape cierran solo la de arriba", () => {
  render(<Dos />);
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  expect(screen.getByRole("dialog", { name: "Editar entreno" })).toBeInTheDocument();
  const [idDetalle] = window.history.state.hojas;

  atras({ vista: "home", hojas: [idDetalle] }); // vuelve al estado del detalle
  expect(screen.queryByRole("dialog", { name: "Editar entreno" })).not.toBeInTheDocument();
  expect(screen.getByRole("dialog", { name: "Detalle" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog", { name: "Editar entreno" })).not.toBeInTheDocument();
  expect(screen.getByRole("dialog", { name: "Detalle" })).toBeInTheDocument();
});
