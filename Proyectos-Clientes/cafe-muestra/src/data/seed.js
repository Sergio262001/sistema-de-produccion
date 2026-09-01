// Datos semilla. En producción viven en tu base de datos;
// aquí sirven para arrancar y para el adaptador local.
export const SEED = {
  categorias: [
    { id:'cafe', nombre:'Café', desc:'Tostado propio, grano de origen', items:[
      { id:'c1', nombre:'Espresso', desc:'Doble shot, intenso', precio:4500, emoji:'☕', disp:true },
      { id:'c2', nombre:'Latte de la casa', desc:'Leche texturizada, arte latte', precio:8500, emoji:'🥛', disp:true, badge:'top' },
      { id:'c3', nombre:'Cold brew', desc:'Extracción en frío 18h', precio:9000, emoji:'🧊', disp:true },
    ]},
    { id:'brunch', nombre:'Brunch', desc:'Hasta las 2 de la tarde', items:[
      { id:'b1', nombre:'Huevos benedictinos', desc:'Pan de masa madre, holandesa', precio:18500, emoji:'🍳', disp:true, badge:'top' },
      { id:'b2', nombre:'Avo toast', desc:'Aguacate, tomate, sésamo', precio:15000, emoji:'🥑', disp:true },
    ]},
    { id:'postres', nombre:'Postres', desc:'Hechos en casa', items:[
      { id:'p1', nombre:'Cheesecake', desc:'Frutos del bosque', precio:11000, emoji:'🍰', disp:true },
      { id:'p2', nombre:'Brownie', desc:'Chocolate 70%, nuez', precio:9500, emoji:'🍫', disp:true },
    ]},
  ],
};
