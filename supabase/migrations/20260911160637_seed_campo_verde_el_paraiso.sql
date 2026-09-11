-- Actualiza CAMPO VERDE y carga El Paraíso con lotes y planos.

update public.projects
set
  name = 'Campo Verde Residencial',
  slug = 'campo-verde-residencial',
  logo_url = '/logos/campo-verde-residencial.jpg',
  plan_url = '/planos/campo-verde-residencial.jpg'
where id = 'b54328da-df02-4b45-ad3f-7d7b3a5bdd52'
   or slug in ('campo-verde', 'campo-verde-', 'campo-verde-residencial')
   or name ilike 'campo verde%';

insert into public.projects (id, company_id, name, slug, logo_url, plan_url)
values (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Residencial El Paraíso de Virú',
  'el-paraiso-de-viru',
  '/logos/el-paraiso-de-viru.png',
  '/planos/el-paraiso-de-viru.jpg'
)
on conflict (slug) do update set
  name = excluded.name,
  logo_url = excluded.logo_url,
  plan_url = excluded.plan_url;

insert into public.lots (project_id, manzana, numero, area_m2, price, status)
select p.id, x.manzana, x.numero, x.area_m2, x.price, 'disponible'::public.lot_status
from public.projects p
cross join lateral jsonb_to_recordset($cv$
[
  {
    "manzana": "A",
    "numero": 1,
    "area_m2": 133.68,
    "price": 45600
  },
  {
    "manzana": "A",
    "numero": 2,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 3,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 4,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 5,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 6,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 7,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 8,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 9,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 10,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 11,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 12,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 13,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 14,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 15,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 16,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 17,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 18,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 19,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 20,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 21,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 22,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 23,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 24,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 25,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 26,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "A",
    "numero": 27,
    "area_m2": 92.3,
    "price": 28700
  },
  {
    "manzana": "B",
    "numero": 1,
    "area_m2": 112.22,
    "price": 37500
  },
  {
    "manzana": "B",
    "numero": 2,
    "area_m2": 97.95,
    "price": 32700
  },
  {
    "manzana": "B",
    "numero": 3,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "B",
    "numero": 4,
    "area_m2": 90.04,
    "price": 31000
  },
  {
    "manzana": "B",
    "numero": 5,
    "area_m2": 90.36,
    "price": 31200
  },
  {
    "manzana": "B",
    "numero": 6,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "B",
    "numero": 7,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "B",
    "numero": 8,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "B",
    "numero": 9,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "C",
    "numero": 1,
    "area_m2": 93.28,
    "price": 31100
  },
  {
    "manzana": "C",
    "numero": 2,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "C",
    "numero": 3,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "C",
    "numero": 4,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "C",
    "numero": 5,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "C",
    "numero": 6,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "C",
    "numero": 7,
    "area_m2": 93.28,
    "price": 31100
  },
  {
    "manzana": "C",
    "numero": 8,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "C",
    "numero": 9,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "C",
    "numero": 10,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "C",
    "numero": 11,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "C",
    "numero": 12,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "C",
    "numero": 13,
    "area_m2": 103,
    "price": 31000
  },
  {
    "manzana": "C",
    "numero": 14,
    "area_m2": 103,
    "price": 31000
  },
  {
    "manzana": "C",
    "numero": 15,
    "area_m2": 103,
    "price": 31000
  },
  {
    "manzana": "D",
    "numero": 1,
    "area_m2": 94.8,
    "price": 32600
  },
  {
    "manzana": "D",
    "numero": 2,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "D",
    "numero": 3,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "D",
    "numero": 4,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "D",
    "numero": 5,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "D",
    "numero": 6,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "D",
    "numero": 7,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "D",
    "numero": 8,
    "area_m2": 94.8,
    "price": 32600
  },
  {
    "manzana": "D",
    "numero": 9,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "D",
    "numero": 10,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "D",
    "numero": 11,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "D",
    "numero": 12,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "D",
    "numero": 13,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "D",
    "numero": 14,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "E",
    "numero": 1,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "E",
    "numero": 2,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "E",
    "numero": 3,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "E",
    "numero": 4,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "E",
    "numero": 5,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "E",
    "numero": 6,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "E",
    "numero": 7,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "E",
    "numero": 8,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "E",
    "numero": 9,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "E",
    "numero": 10,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "E",
    "numero": 11,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "E",
    "numero": 12,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "E",
    "numero": 13,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "F",
    "numero": 1,
    "area_m2": 99.12,
    "price": 31000
  },
  {
    "manzana": "F",
    "numero": 2,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "F",
    "numero": 3,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "F",
    "numero": 4,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "F",
    "numero": 5,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "F",
    "numero": 6,
    "area_m2": 90,
    "price": 34110
  },
  {
    "manzana": "F",
    "numero": 7,
    "area_m2": 116.15,
    "price": 38900
  },
  {
    "manzana": "F",
    "numero": 8,
    "area_m2": 99.12,
    "price": 25600
  },
  {
    "manzana": "F",
    "numero": 9,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "F",
    "numero": 10,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "F",
    "numero": 11,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "F",
    "numero": 12,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "G",
    "numero": 1,
    "area_m2": 90,
    "price": 31000
  },
  {
    "manzana": "G",
    "numero": 2,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 3,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 4,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 5,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 6,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 7,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 8,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 9,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 10,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 11,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 12,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 13,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 14,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 15,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 16,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 17,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 18,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 19,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 20,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 21,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 22,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 23,
    "area_m2": 90,
    "price": 26000
  },
  {
    "manzana": "G",
    "numero": 24,
    "area_m2": 90,
    "price": 27000
  }
]
$cv$::jsonb) as x(manzana text, numero int, area_m2 numeric, price numeric)
where p.slug = 'campo-verde-residencial'
on conflict (project_id, manzana, numero) do nothing;

insert into public.lots (project_id, manzana, numero, area_m2, price, status)
select p.id, x.manzana, x.numero, x.area_m2, x.price, 'disponible'::public.lot_status
from public.projects p
cross join lateral jsonb_to_recordset($ep$
[
  {
    "manzana": "A",
    "numero": 1,
    "area_m2": 130,
    "price": 60000
  },
  {
    "manzana": "A",
    "numero": 2,
    "area_m2": 105,
    "price": 39500
  },
  {
    "manzana": "A",
    "numero": 3,
    "area_m2": 105,
    "price": 39500
  },
  {
    "manzana": "A",
    "numero": 4,
    "area_m2": 100,
    "price": 38000
  },
  {
    "manzana": "A",
    "numero": 5,
    "area_m2": 100,
    "price": 38000
  },
  {
    "manzana": "A",
    "numero": 6,
    "area_m2": 100,
    "price": 38000
  },
  {
    "manzana": "A",
    "numero": 7,
    "area_m2": 100,
    "price": 38000
  },
  {
    "manzana": "A",
    "numero": 8,
    "area_m2": 100,
    "price": 38000
  },
  {
    "manzana": "A",
    "numero": 9,
    "area_m2": 100,
    "price": 38000
  },
  {
    "manzana": "A",
    "numero": 10,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "A",
    "numero": 11,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "A",
    "numero": 12,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "A",
    "numero": 13,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "A",
    "numero": 14,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "A",
    "numero": 15,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "A",
    "numero": 16,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "A",
    "numero": 17,
    "area_m2": 95,
    "price": 39350
  },
  {
    "manzana": "B",
    "numero": 1,
    "area_m2": 100,
    "price": 48000
  },
  {
    "manzana": "B",
    "numero": 2,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "B",
    "numero": 3,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "B",
    "numero": 4,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "B",
    "numero": 5,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "C",
    "numero": 1,
    "area_m2": 90,
    "price": 39500
  },
  {
    "manzana": "C",
    "numero": 2,
    "area_m2": 90,
    "price": 39500
  },
  {
    "manzana": "C",
    "numero": 3,
    "area_m2": 90,
    "price": 39500
  },
  {
    "manzana": "C",
    "numero": 4,
    "area_m2": 90,
    "price": 39500
  },
  {
    "manzana": "C",
    "numero": 5,
    "area_m2": 90,
    "price": 39500
  },
  {
    "manzana": "C",
    "numero": 6,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "C",
    "numero": 7,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "C",
    "numero": 8,
    "area_m2": 100,
    "price": 43000
  },
  {
    "manzana": "C",
    "numero": 9,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "C",
    "numero": 10,
    "area_m2": 100,
    "price": 38000
  },
  {
    "manzana": "C",
    "numero": 11,
    "area_m2": 100,
    "price": 38000
  },
  {
    "manzana": "C",
    "numero": 12,
    "area_m2": 100,
    "price": 43000
  },
  {
    "manzana": "D",
    "numero": 1,
    "area_m2": 105,
    "price": 42650
  },
  {
    "manzana": "D",
    "numero": 2,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "D",
    "numero": 3,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "D",
    "numero": 4,
    "area_m2": 110,
    "price": 46500
  },
  {
    "manzana": "D",
    "numero": 5,
    "area_m2": 95,
    "price": 41250
  },
  {
    "manzana": "D",
    "numero": 6,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "D",
    "numero": 7,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "D",
    "numero": 8,
    "area_m2": 90,
    "price": 37700
  },
  {
    "manzana": "E",
    "numero": 1,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 2,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 3,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 4,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 5,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 6,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 7,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 8,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 9,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 10,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 11,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 12,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 13,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "E",
    "numero": 14,
    "area_m2": 90,
    "price": 44000
  },
  {
    "manzana": "F",
    "numero": 1,
    "area_m2": 90,
    "price": 39500
  },
  {
    "manzana": "F",
    "numero": 2,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "F",
    "numero": 3,
    "area_m2": 90,
    "price": 39500
  },
  {
    "manzana": "F",
    "numero": 4,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "F",
    "numero": 5,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "F",
    "numero": 6,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "F",
    "numero": 7,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "F",
    "numero": 8,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "F",
    "numero": 9,
    "area_m2": 90,
    "price": 39500
  },
  {
    "manzana": "F",
    "numero": 10,
    "area_m2": 90,
    "price": 39500
  },
  {
    "manzana": "F",
    "numero": 11,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "F",
    "numero": 12,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "F",
    "numero": 13,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "F",
    "numero": 14,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "F",
    "numero": 15,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "G",
    "numero": 1,
    "area_m2": 90,
    "price": 37700
  },
  {
    "manzana": "G",
    "numero": 2,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "G",
    "numero": 3,
    "area_m2": 100,
    "price": 43000
  },
  {
    "manzana": "G",
    "numero": 4,
    "area_m2": 100,
    "price": 38000
  },
  {
    "manzana": "G",
    "numero": 5,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "G",
    "numero": 6,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "G",
    "numero": 7,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "G",
    "numero": 8,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "G",
    "numero": 9,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "G",
    "numero": 10,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "G",
    "numero": 11,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "G",
    "numero": 12,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "G",
    "numero": 13,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "H",
    "numero": 1,
    "area_m2": 95,
    "price": 46000
  },
  {
    "manzana": "H",
    "numero": 2,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "H",
    "numero": 3,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "H",
    "numero": 4,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "H",
    "numero": 5,
    "area_m2": 95,
    "price": 36500
  },
  {
    "manzana": "H",
    "numero": 6,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "H",
    "numero": 7,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "H",
    "numero": 8,
    "area_m2": 90,
    "price": 35000
  },
  {
    "manzana": "H",
    "numero": 9,
    "area_m2": 95,
    "price": 39350
  }
]
$ep$::jsonb) as x(manzana text, numero int, area_m2 numeric, price numeric)
where p.slug = 'el-paraiso-de-viru'
on conflict (project_id, manzana, numero) do nothing;
