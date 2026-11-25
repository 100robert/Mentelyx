import { useEffect, useState } from 'react';

/**
 * `true` cuando React ya controla la página. Los formularios con `onSubmit` deshabilitan su envío hasta entonces: así un
 * envío nativo anterior a la hidratación nunca manda los datos (por ejemplo, una contraseña) en la URL.
 */
export function useHidratado() {
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => setHidratado(true), []);
  return hidratado;
}
