# Contrato base — términos, pagos, mantenimiento

> ⚠️ **Esto no es asesoría legal.** Es un esqueleto de las secciones que un
> contrato de este tipo suele necesitar, para que no llegues a redactar uno
> desde cero. **Hazlo revisar por un abogado** antes de usarlo con un
> cliente real — en particular las cláusulas de datos personales (Colombia
> tiene la Ley 1581 de 2012 de habeas data, relevante si el proyecto guarda
> datos de clientes/pacientes, ver `clinica.yml` como ejemplo de cuándo
> aplica) y de propiedad intelectual del código entregado.

## Secciones que debería tener
1. **Partes** — quién contrata (el estudio) y quién es el cliente, con
   datos completos de identificación.
2. **Objeto del contrato** — qué se construye, basado literalmente en la
   sección "Qué incluye" de `plantilla-de-propuesta.md` ya confirmada. No
   redactes el alcance de nuevo aquí: copia el de la propuesta firmada.
3. **Plazos** — los mismos de la tabla de tiempos de la propuesta, con la
   cláusula de que se corren si el cliente se demora en entregar contenido.
4. **Precio y forma de pago** — anticipo, saldo, qué pasa si no se paga a
   tiempo (¿se detiene el trabajo? ¿interés de mora?).
5. **Propiedad intelectual** — quién es dueño del código entregado al
   pagar el saldo final (lo normal: el cliente, una vez pagado todo). Deja
   explícito qué pasa con las **bases reutilizables** de este sistema: tú
   sigues siendo dueño de la base genérica (`02-bases/`), el cliente es
   dueño del producto configurado que se le entregó, no de la base en sí.
6. **Garantía / corrección de errores** — por cuánto tiempo después de la
   entrega corriges errores sin costo (distinto de "alcance adicional",
   que se cotiza aparte — ver `plantilla-de-propuesta.md` sección 3).
7. **Mantenimiento** — si el cliente toma un plan de
   `planes-de-soporte.md`, se referencia aquí: qué incluye, cómo se cancela.
8. **Datos personales** — si el proyecto guarda datos de clientes/pacientes
   (leads, pedidos, historiales), quién es responsable del tratamiento de
   esos datos ante la ley, y qué medidas de seguridad mínimas se
   comprometen (ver buena práctica #5 de `CLAUDE.md`: RLS desde el día uno).
9. **Terminación anticipada** — qué pasa si alguna de las partes quiere
   parar el proyecto a mitad de camino (qué se cobra por el trabajo ya
   hecho, qué se entrega).
10. **Confidencialidad** — si el cliente comparte información sensible del
    negocio (precios de costo, datos financieros) que no debe usarse fuera
    de este proyecto.

## Cómo usarlo
1. Llévalo a un abogado antes del primer uso real — esto es un punto de
   partida, no un contrato terminado.
2. Una vez aprobado, guárdalo como plantilla fuera de este repo (es un
   documento legal, no técnico — no tiene que vivir en el repo del sistema
   de producción, y definitivamente no debe ir en el repo del cliente).
3. Llena las secciones 2-4 con los datos exactos de la propuesta ya
   confirmada — nunca improvises el alcance de nuevo en el contrato.
