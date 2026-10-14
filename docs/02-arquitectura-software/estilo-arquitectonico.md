# Estilo arquitectónico de Mentelyx

## Estilo seleccionado

Mentelyx utilizará una estructura cliente-servidor con un backend
monolítico modular y procesamiento complementario serverless.

El frontend será una aplicación web responsive y mobile-first,
instalable como PWA.

Los módulos del núcleo se ejecutarán dentro de una misma aplicación
desplegable. Las funciones serverless realizarán el envío de
notificaciones y la activación periódica de recordatorios.

## Diagrama

```mermaid
flowchart TB

    ACT["Estudiante · Docente · Administración"]
    WEB["Frontend Web + PWA"]

    ACT --> WEB

    subgraph MONOLITO["BACKEND MONOLÍTICO MODULAR — Una aplicación desplegable"]

        MW["API REST · Autenticación · Autorización · Validación · Registro de errores"]

        subgraph PRESENTACION["1. PRESENTACIÓN — Rutas y controladores"]
            U_R["/usuarios"]
            A_R["/aprendizaje"]
            S_R["/suscripciones"]
            T_R["/tutorias"]
            P_R["/pagos"]

            U_C["ControladorUsuarios"]
            A_C["ControladorAprendizaje"]
            S_C["ControladorSuscripciones"]
            T_C["ControladorTutorias"]
            P_C["ControladorPagos"]

            U_R --> U_C
            A_R --> A_C
            S_R --> S_C
            T_R --> T_C
            P_R --> P_C
        end

        subgraph NEGOCIO["2. NEGOCIO — Casos de uso y reglas del dominio"]
            U_S["RegistrarUsuario / AsignarPermisos"]
            A_S["EvaluarIntento / ActualizarRuta"]
            S_S["ActivarSuscripcion / ConsultarBeneficios"]
            T_S["ReservarTutoria / ControlarCupos"]
            P_S["ConfirmarPago / CalcularLiquidacion"]
        end

        subgraph INFRA["3. INFRAESTRUCTURA — Repositorios y adaptadores"]
            U_D["RepositorioUsuarios"]
            A_D["RepositorioAprendizaje"]
            S_D["RepositorioSuscripciones"]
            T_D["RepositorioReservas"]
            P_D["RepositorioPagos"]

            DB_ACCESS["Infraestructura de persistencia"]
            PAY_ADAPTER["Adaptador de pasarela"]
        end

        MW --> U_R
        MW --> A_R
        MW --> S_R
        MW --> T_R
        MW --> P_R

        U_C --> U_S --> U_D
        A_C --> A_S --> A_D
        S_C --> S_S --> S_D
        T_C --> T_S --> T_D
        P_C --> P_S --> P_D

        U_D --> DB_ACCESS
        A_D --> DB_ACCESS
        S_D --> DB_ACCESS
        T_D --> DB_ACCESS
        P_D --> DB_ACCESS

        T_S -.->|"Consultar pago"| P_S
        P_S --> PAY_ADAPTER

        subgraph COMPLEMENTARIOS["MÓDULOS COMPLEMENTARIOS — Dentro del monolito"]
            OTROS["Contenidos · Convenios · Docentes · Auditoría y soporte"]
            NOTI["Notificaciones: validar destinatarios y preparar avisos"]
        end

        DB_ACCESS ~~~ OTROS
        OTROS ~~~ NOTI

        T_S -.->|"Reserva confirmada"| NOTI
        S_S -.->|"Suscripción activada"| NOTI
    end

    WEB -->|"HTTPS"| MW

    DB[("Base de datos relacional")]
    PASARELA["Servicio externo de pagos"]

    DB_ACCESS --> DB
    PAY_ADAPTER <-->|"API del proveedor"| PASARELA

    subgraph ASINCRONO["INFRAESTRUCTURA ASÍNCRONA"]
        CRON["Programador de ejecuciones"]
        QUEUE["Cola de notificaciones"]
    end

    subgraph SERVERLESS["FUNCIONES SERVERLESS — Fuera del monolito"]
        RECORDAR["ActivarRecordatorios"]
        ENVIAR["EnviarNotificacion"]
    end

    PROVEEDOR["Proveedor externo de notificaciones"]

    CRON -->|"Ejecución periódica"| RECORDAR
    RECORDAR -->|"Solicitar recordatorios mediante API interna"| NOTI

    NOTI -->|"Publicar tareas mediante adaptador"| QUEUE
    QUEUE -->|"Entregar tarea"| ENVIAR
    ENVIAR -->|"Solicitar envío"| PROVEEDOR
    ENVIAR -.->|"Registrar resultado mediante API interna"| NOTI

    classDef presentacion fill:#e5edf9,stroke:#7893b8,color:#20334b;
    classDef negocio fill:#e7f0df,stroke:#85a36e,color:#2c4022;
    classDef infraestructura fill:#fff1d4,stroke:#b69a5d,color:#4b3c20;
    classDef serverless fill:#eee6f7,stroke:#9878b2,color:#443052;

    class MW,U_R,A_R,S_R,T_R,P_R,U_C,A_C,S_C,T_C,P_C presentacion;
    class U_S,A_S,S_S,T_S,P_S,OTROS,NOTI negocio;
    class U_D,A_D,S_D,T_D,P_D,DB_ACCESS,PAY_ADAPTER,DB,CRON,QUEUE infraestructura;
    class RECORDAR,ENVIAR serverless;
```

## Distribución de responsabilidades

| Componente | Ubicación | Responsabilidad |
|---|---|---|
| Frontend Web + PWA | Cliente | Presentar las funciones disponibles según el usuario y comunicarse con la API. |
| Módulos del negocio | Monolito modular | Gestionar usuarios, aprendizaje, contenidos, suscripciones, convenios, docentes, tutorías y operaciones económicas. |
| Módulo de Notificaciones | Monolito modular | Determinar los avisos válidos, sus destinatarios y contenido, y registrar su procesamiento. |
| ActivarRecordatorios | Función serverless | Solicitar periódicamente al backend la preparación de los recordatorios pendientes. |
| EnviarNotificacion | Función serverless | Procesar tareas de la cola, solicitar su envío al proveedor y comunicar el resultado al backend. |
| Cola de notificaciones | Infraestructura asíncrona | Conservar y entregar tareas pendientes. |
| Programador de ejecuciones | Infraestructura asíncrona | Activar periódicamente la función de recordatorios. |

## Reglas de organización

1. Los módulos del núcleo compartirán una unidad de despliegue,
   manteniendo responsabilidades delimitadas.

2. La comunicación entre módulos se realizará mediante interfaces
   internas. Un módulo no modificará directamente los datos de otro.

3. Las reglas educativas, comerciales y de autorización permanecerán
   en el backend.

4. Las funciones serverless accederán a las operaciones internas
   mediante mecanismos autenticados y permisos limitados.

5. Antes de preparar un recordatorio, el backend verificará que
   la tutoría y sus destinatarios continúen siendo válidos.

6. Un fallo en el envío de una notificación no anulará una reserva
   o un pago confirmado.

7. El procesamiento de tareas contemplará reintentos y controles
   para evitar duplicados.

## Lectura del diagrama

- Las columnas detalladas representan cinco módulos del núcleo.
- Los módulos complementarios se muestran resumidos para mantener
  la legibilidad.
- Las flechas continuas representan comunicación durante la ejecución.
- Las flechas discontinuas identifican colaboraciones o notificaciones
  entre componentes.
- La cola y el programador son infraestructura de apoyo; no son
  funciones serverless.
- Las conexiones internas de recordatorios y resultados representan
  operaciones protegidas de la API, resumidas en el diagrama.
- Las flechas no representan las dependencias del código de
  Clean Architecture.

## Elementos complementarios

Los videos y materiales se conservarán en almacenamiento de archivos
integrado mediante adaptadores.

La caché de recursos estáticos y consultas públicas se mantiene como
propuesta ADR-012. Su incorporación no sustituirá la validación de pagos,
permisos o cupos en las operaciones del negocio.

Estos elementos se omiten en esta vista resumida para destacar
la estructura modular y la distribución del procesamiento.

## Decisiones relacionadas

- ADR-001: núcleo de negocio mediante monolito modular.
- ADR-003: frontend Web + PWA conectado mediante API REST.
- ADR-005: integración de pagos mediante contratos y adaptadores.
- ADR-008: notificaciones y recordatorios mediante funciones serverless.
- ADR-009: almacenamiento separado de archivos.