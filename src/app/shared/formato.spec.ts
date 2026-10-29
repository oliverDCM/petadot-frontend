import {
  describirAnimal,
  enlaceCorreo,
  enlaceWhatsApp,
  telefonoInternacional,
  textoEdad,
  transicionesPermitidas,
} from './formato';

describe('formato', () => {
  it('describe la edad en meses y años', () => {
    expect(textoEdad(null)).toBe('Edad sin indicar');
    expect(textoEdad(0)).toBe('Menos de un mes');
    expect(textoEdad(1)).toBe('1 mes');
    expect(textoEdad(5)).toBe('5 meses');
    expect(textoEdad(12)).toBe('1 año');
    expect(textoEdad(14)).toBe('1 año y 2 meses');
    expect(textoEdad(25)).toBe('2 años y 1 mes');
  });

  it('describe especie y sexo con naturalidad', () => {
    expect(describirAnimal('PERRO', 'MACHO')).toBe('Perro macho');
    expect(describirAnimal('PERRO', 'HEMBRA')).toBe('Perra');
    expect(describirAnimal('GATO', 'HEMBRA')).toBe('Gata');
    expect(describirAnimal('OTRO', 'MACHO')).toBe('Otra especie, macho');
  });

  it('replica las transiciones de estado del backend', () => {
    expect(transicionesPermitidas('DISPONIBLE')).toEqual(['RETIRADO']);
    expect(transicionesPermitidas('RESERVADO')).toEqual(['ADOPTADO', 'DISPONIBLE', 'RETIRADO']);
    expect(transicionesPermitidas('ADOPTADO')).toEqual([]);
    expect(transicionesPermitidas('RETIRADO')).toEqual([]);
  });

  it('convierte celulares colombianos a formato internacional', () => {
    expect(telefonoInternacional('300 123 4567')).toBe('573001234567');
    expect(telefonoInternacional('+57 300-123-4567')).toBe('573001234567');
    expect(telefonoInternacional('12345')).toBeNull();
    expect(telefonoInternacional(null)).toBeNull();
  });

  it('arma los enlaces de WhatsApp y correo con el texto codificado', () => {
    expect(enlaceWhatsApp('3001234567', 'Hola Ana')).toBe('https://wa.me/573001234567?text=Hola%20Ana');
    expect(enlaceWhatsApp(null, 'Hola')).toBeNull();
    expect(enlaceCorreo('ana@test.com', 'Entrega de Lupe')).toBe('mailto:ana@test.com?subject=Entrega%20de%20Lupe');
  });
});
