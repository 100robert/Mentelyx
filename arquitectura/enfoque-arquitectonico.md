# Enfoque arquitectónico de Mentelyx

## Enfoque seleccionado

| Elemento | Descripción aplicada a Mentelyx |
|---|---|
| Enfoque arquitectónico | Clean Architecture. |
| Alcance del diagrama | Organización interna del frontend Web + PWA. |
| Objetivo | Separar las pantallas, los casos de uso, los modelos y la comunicación con el backend. |
| Problema que resuelve | Evitar que los componentes visuales dependan directamente de solicitudes HTTP y de los detalles de los servicios externos. |
| Capas definidas | Presentación, Aplicación, Dominio e Infraestructura. |
| Beneficios | Facilitar las pruebas, el mantenimiento y la sustitución de adaptadores sin modificar innecesariamente las pantallas o los casos de uso. |

## Diagrama

```mermaid
flowchart TB

    USUARIO["Estudiante / Docente / Administrador"]

    subgraph FRONTEND["MENTELYX WEB + PWA"]

        subgraph EXTERIOR["ADAPTADORES Y FRAMEWORKS"]

            subgraph PRESENTACION["PRESENTACIÓN"]
                P1["PantallaRutaAprendizaje"]
                P2["PantallaEjercicio"]
                P3["PantallaTutorias"]
                P4["Estado de interfaz"]
            end

            subgraph APLICACION["APLICACIÓN — Casos de uso"]

                C1["ConsultarRutaCasoUso"]
                C2["RegistrarIntentoCasoUso"]
                C3["ReservarTutoriaCasoUso"]

                subgraph DOMINIO["DOMINIO — Núcleo independiente"]

                    subgraph MODELOS["MODELOS"]
                        M1["RutaAprendizaje"]
                        M2["IntentoEjercicio"]
                        M3["Tutoria / Reserva"]
                    end

                    subgraph CONTRATOS["CONTRATOS — Puertos"]
                        I1["RepositorioAprendizaje"]
                        I2["RegistroIntentos"]
                        I3["ServicioTutorias"]
                    end

                end
            end

            subgraph INFRAESTRUCTURA["INFRAESTRUCTURA"]
                A1["RepositorioAprendizajeHttp"]
                A2["RegistroIntentosHttp"]
                A3["ServicioTutoriasHttp"]
                HTTP["Cliente HTTP"]
            end

            COMPOSICION["Raíz de composición: selecciona adaptadores e inyecta dependencias"]

        end
    end

    BACKEND["API de Mentelyx — Backend monolítico modular"]

    USUARIO -->|"Interacción"| P1
    USUARIO -->|"Interacción"| P2
    USUARIO -->|"Interacción"| P3

    P1 -->|"Invoca"| C1
    P2 -->|"Invoca"| C2
    P3 -->|"Invoca"| C3

    P1 --> P4
    P2 --> P4
    P3 --> P4

    C1 -->|"Utiliza"| I1
    C2 -->|"Utiliza"| I2
    C3 -->|"Utiliza"| I3

    C1 --> M1
    C2 --> M2
    C3 --> M3

    A1 -.->|"Implementa"| I1
    A2 -.->|"Implementa"| I2
    A3 -.->|"Implementa"| I3

    A1 --> HTTP
    A2 --> HTTP
    A3 --> HTTP

    HTTP -->|"HTTPS / JSON"| BACKEND

    COMPOSICION -.->|"Configura"| A1
    COMPOSICION -.->|"Configura"| A2
    COMPOSICION -.->|"Configura"| A3

    classDef presentacion fill:#e5edf9,stroke:#7893b8,color:#20334b;
    classDef aplicacion fill:#e7f0df,stroke:#85a36e,color:#2c4022;
    classDef dominio fill:#fff4d7,stroke:#bd9c46,color:#4b3c20;
    classDef infraestructura fill:#eee6f7,stroke:#9878b2,color:#443052;

    class P1,P2,P3,P4 presentacion;
    class C1,C2,C3 aplicacion;
    class M1,M2,M3,I1,I2,I3 dominio;
    class A1,A2,A3,HTTP,COMPOSICION infraestructura;
```

## Responsabilidades

### Presentación

Contiene las pantallas, componentes visuales y estado de la interfaz.

Permite mostrar la ruta de aprendizaje, resolver ejercicios y solicitar
reservas de tutorías.

Los componentes invocan casos de uso y muestran sus resultados.
No realizan directamente las solicitudes HTTP.

El estado de interfaz incluye elementos como indicadores de carga,
selecciones y mensajes de error. No constituye la fuente autorizada
de pagos, permisos o reservas.

### Aplicación

Contiene los casos de uso del frontend.

| Caso de uso | Responsabilidad |
|---|---|
| ConsultarRutaCasoUso | Solicitar la ruta del estudiante mediante el contrato correspondiente y entregar el resultado a Presentación. |
| RegistrarIntentoCasoUso | Preparar y enviar el intento del estudiante y obtener la respuesta del backend. |
| ReservarTutoriaCasoUso | Solicitar una reserva y devolver el estado informado por el backend. |

Estos casos de uso conocen los modelos y contratos del Dominio.
No conocen los adaptadores HTTP concretos.

### Dominio

Contiene los modelos y contratos utilizados por los casos de uso.

| Tipo | Elementos |
|---|---|
| Modelos | RutaAprendizaje, IntentoEjercicio, Tutoria y Reserva. |
| Contratos | RepositorioAprendizaje, RegistroIntentos y ServicioTutorias. |

Los contratos expresan las operaciones necesarias sin especificar
cómo se obtiene o transmite la información.

El núcleo no depende del framework de interfaz, del navegador ni
de una biblioteca HTTP.

### Infraestructura

Implementa los contratos mediante adaptadores.

| Contrato | Implementación inicial |
|---|---|
| RepositorioAprendizaje | RepositorioAprendizajeHttp. |
| RegistroIntentos | RegistroIntentosHttp. |
| ServicioTutorias | ServicioTutoriasHttp. |

Los adaptadores utilizan el cliente HTTP para comunicarse con la API
de Mentelyx y transformar las respuestas en los modelos correspondientes.

Para pruebas podrán utilizarse implementaciones en memoria que cumplan
los mismos contratos.

### Raíz de composición

Es el punto de configuración que selecciona las implementaciones
y las proporciona a los casos de uso.

Por ejemplo, conecta RepositorioAprendizajeHttp con
ConsultarRutaCasoUso mediante el contrato RepositorioAprendizaje.

Los casos de uso no crean directamente sus adaptadores.

## Reglas de dependencia

1. Presentación utiliza los casos de uso de Aplicación.

2. Aplicación depende de los modelos y contratos del Dominio.

3. Infraestructura implementa los contratos del Dominio.

4. Dominio no depende de las demás capas.

5. La raíz de composición conecta las implementaciones concretas.

6. Las flechas entre componentes representan dependencias o uso.
   Las conexiones con el usuario y el backend representan interacción externa.

## Relación con el backend

Esta vista organiza el frontend; no traslada las reglas críticas
del servidor al navegador.

El backend conservará la responsabilidad de:

- Verificar identidad, permisos y beneficios.
- Evaluar y registrar los resultados académicos.
- Calcular y actualizar la personalización del aprendizaje.
- Comprobar cupos y confirmar reservas.
- Verificar pagos y calcular liquidaciones docentes.

El frontend mostrará los estados devueltos por el backend y no podrá
confirmar por sí mismo una operación económica o una reserva.

## Relación con serverless

El frontend se comunicará con la API de Mentelyx.

El backend preparará las tareas de notificación y las publicará
mediante sus adaptadores.

Las funciones EnviarNotificacion y ActivarRecordatorios permanecerán
en la arquitectura global, fuera del frontend. No se consideran capas
de Clean Architecture.