# Cafe Muestra

Generado desde la base `menu-con-panel-admin` el 2026-09-01.

## Correrlo ahora mismo

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (normalmente http://localhost:5173).
Arranca aunque el `.env` esté incompleto: los adaptadores caen a datos
locales de ejemplo. Lo que falte simplemente no persistirá.

> Vite hace falta porque un HTML suelto no puede leer un `.env` desde el
> navegador. `vite.config.js` amplía `envPrefix` para que los adaptadores
> copiados de la base funcionen sin reescribirlos.

## Lo que falta para que funcione de verdad

- [ ] `SUPABASE_URL` — está como `FALTA` en el `.env`
- [ ] `SUPABASE_ANON_KEY` — está como `FALTA` en el `.env`
- [ ] `WHATSAPP_NUM` — está como `FALTA` en el `.env`
- [ ] `WOMPI_PUBLIC_KEY` — está como `FALTA` en el `.env`
- [ ] `GA4_ID` — está como `FALTA` en el `.env`

- [ ] Correr `supabase.schema.sql` en el SQL Editor del proyecto Supabase.
      Crea las tablas, los datos de ejemplo y las políticas RLS.

## Antes de entregar

```bash
npm run validar
```

Sale con error si hay XSS, contraste insuficiente, RLS faltante o un
secreto en el código. No entregues con errores en rojo.

## Qué pedirle al cliente

La lista completa está en `09-que-necesito-de-ti/1-menu-qr.md`.

**La cuenta de wompi la abre el cliente**, con su NIT y su
cuenta bancaria: el dinero de sus ventas debe llegarle a él. Tú solo
integras la llave pública que te comparta.

## Origen

No se reescribió ningún adaptador: `src/` es copia literal de la base.
Si arreglas un bug ahí, arréglalo también en
`02-bases/menu-con-panel-admin/src/`, o la próxima copia lo trae de vuelta.
