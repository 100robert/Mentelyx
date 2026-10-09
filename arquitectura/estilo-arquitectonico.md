# Estilo arquitectónico de Mentelyx

Mentelyx tendrá un frontend Web + PWA y un backend monolítico modular.
Las notificaciones y los recordatorios se procesarán mediante capacidades
serverless complementarias.

## Diagrama

```mermaid
flowchart TB
    US["Estudiantes · Docentes · Administradores"]
    WEB["Aplicación Web + PWA"]

    US --> WEB

    subgraph BACKEND["BACKEND MONOLÍTICO MODULAR · Una aplicación desplegable"]

        API["API REST · Autenticación · Autorización"]

        subgraph PRESENTACION["PRESENTACIÓN · Controladores"]
            direction LR
            C1["Usuarios"]
            C2["Aprendizaje"]
            C3["Suscripciones"]
            C4["Tutorías"]
            C5["Pagos"]
        end

        subgraph NEGOCIO["NEGOCIO · Casos de uso y reglas"]
            direction LR
            N1["Cuentas y permisos"]
            N2["Diagnóstico y rutas"]
            N3["Planes y beneficios"]
            N4["Reservas y cupos"]
            N5["Cobros y liquidaciones"]
        end

        subgraph PERSISTENCIA["PERSISTENCIA · Implementaciones de repositorios"]
            direction LR
            R1["Usuarios"]
            R2["Progreso académico"]
            R3["Suscripciones"]
            R4["Reservas"]
            R5["Transacciones"]
        end

        API --> C1
        API --> C2
        API --> C3
        API --> C4
        API --> C5

        C1 --> N1 --> R1
        C2 --> N2 --> R2
        C3 --> N3 --> R3
        C4 --> N4 --> R4
        C5 --> N5 --> R5

        DATOS["Conexión a datos"]

        R1 --> DATOS
        R2 --> DATOS
        R3 --> DATOS
        R4 --> DATOS
        R5 --> DATOS

        OTROS["También dentro del núcleo:<br/>Contenidos · Convenios · Docentes<br/>Notificaciones · Auditoría y soporte"]
    end

    WEB -->|"HTTPS"| API

    DB[("Base de datos")]
    DATOS --> DB

    PAGO["Pasarela externa"]
    N5 -->|"Adaptador de pagos"| PAGO

    subgraph ASINCRONO["PROCESAMIENTO ASÍNCRONO"]
        COLA["Cola de tareas"]
        FN["Funciones serverless"]
        AVISO["Proveedor de notificaciones"]

        COLA --> FN --> AVISO
    end

    OTROS -->|"Módulo de Notificaciones"| COLA

    classDef presentacion fill:#e7effa,stroke:#6b8fb5,color:#1c3045;
    classDef negocio fill:#eaf3e5,stroke:#7e9d70,color:#293e23;
    classDef datos fill:#fff3da,stroke:#b49b64,color:#463b24;

    class API,C1,C2,C3,C4,C5 presentacion;
    class N1,N2,N3,N4,N5,OTROS negocio;
    class R1,R2,R3,R4,R5,DATOS,DB datos;
```

## Alcance de la vista

Se detallan cinco módulos para mostrar su organización. Los módulos
adicionales también pertenecen al mismo núcleo y siguen la misma
separación de responsabilidades.

Las flechas verticales representan llamadas durante la ejecución:
controlador, caso de uso y repositorio utilizado mediante un contrato.
No representan las dependencias de código de Clean Architecture.

El almacenamiento de archivos y la caché propuesta se omiten en esta
vista resumida. Se mantienen en el diseño general de la plataforma.