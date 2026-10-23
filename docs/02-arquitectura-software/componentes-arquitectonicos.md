# Componentes arquitectónicos de Mentelyx

Se utiliza el **modelo C4, nivel 3 (Componentes)** para representar los componentes principales del backend de **Mentelyx**, sus responsabilidades y las relaciones con la aplicación web, las bases de datos y los servicios externos. La solución sigue el estilo de **monolito modular en capas** y aplica **Clean Architecture** para desacoplar las reglas de negocio de las tecnologías.

| Elemento | Descripción aplicada a Mentelyx |
|---|---|
| **Modelo arquitectónico** | C4, nivel 3: componentes del contenedor **Mentelyx API Backend**. |
| **Estilo arquitectónico** | Monolito modular en capas: siete módulos de negocio dentro de una única API principal. |
| **Enfoque arquitectónico** | Clean Architecture: colaboración mediante casos de uso, contratos y adaptadores. |
| **Objetivo** | Identificar qué componentes conforman el backend, sus responsabilidades y cómo se relacionan. |
| **¿Qué problema resuelve?** | Evita mezclar responsabilidades y reduce el acoplamiento directo entre módulos, bases de datos y proveedores externos. |
| **Aplicación cliente** | Web/PWA desarrollada con Next.js, React y TypeScript. |
| **Backend** | API REST con Hono y TypeScript; despliegue principal previsto en Cloudflare Workers. |
| **Persistencia y caché** | Neon PostgreSQL + pgvector para datos transaccionales y búsqueda vectorial; MongoDB Atlas para contenido documental; Redis para caché; Cloudflare R2 para archivos. |
| **Integraciones** | Proveedor IA (embeddings y LLM), pasarela de pagos, WebRTC/SFU administrado, Bunny Stream y Cloudflare Queues. |
| **Beneficios** | Claridad de responsabilidades, mantenibilidad, pruebas independientes, integración controlada y evolución de componentes sin convertirlos en microservicios. |

## Componentes principales

| Código | Componente | Responsabilidad |
|---|---|---|
| **C01** | Usuarios y Administración | Registro, perfiles, permisos y habilitaciones para enseñar. |
| **C02** | Cursos y Contenidos | Cursos, recursos educativos y Mentelyx Studio. |
| **C03** | Evaluaciones y Aprendizaje | Diagnósticos, simulacros y progreso académico. |
| **C04** | Docentes y Clases | Horarios, reservas, tutorías y aulas virtuales. |
| **C05** | Suscripciones y Pagos | Planes, créditos, cobros y liquidaciones docentes. |
| **C06** | Tutor IA y RAG | Recuperación semántica mediante pgvector y generación de explicaciones con IA. |
| **C07** | Publicidad y Patrocinios | Gestión de campañas y patrocinios autorizados. |

![Diagrama de componentes arquitectónicos de Mentelyx](../img/mentelyx-componentes-arquitectonicos.png)

**Figura 1.** Diagrama de componentes de Mentelyx (C4, nivel 3). Los siete módulos se encuentran dentro del mismo backend; las bases de datos y los servicios externos se representan fuera de ese límite. **Fuente:** elaboración propia, tomando como referencia el ejemplo académico proporcionado por la docente.

**Regla arquitectónica:** los módulos se comunican mediante contratos internos; sus controladores no deben acceder directamente a bases de datos ni a implementaciones privadas de otros módulos. Las tecnologías externas se integran mediante adaptadores.

> **Estado:** propuesta de arquitectura. Los proveedores candidatos y las capacidades previstas requieren validación durante la implementación.
