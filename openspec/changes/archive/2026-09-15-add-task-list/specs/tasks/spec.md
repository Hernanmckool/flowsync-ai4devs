## Purpose

Da a un equipo una única lista compartida de tareas donde cualquiera puede anotar en qué está trabajando con solo un título, ver de un vistazo quién lleva qué y en qué estado, y mover ese estado sin fricción.

## ADDED Requirements

### Requirement: Lista única y compartida para todo el equipo
El sistema SHALL mostrar una única lista de tareas, igual para cualquier miembro autenticado del equipo, sin tareas privadas ni una vista separada de "mis tareas", y SHALL exigir haber iniciado sesión para verla.

#### Scenario: El contenido no depende de quién mira
- **WHEN** dos personas distintas del equipo abren la lista sin haber tocado nada
- **THEN** las dos ven exactamente el mismo conjunto de tareas

#### Scenario: No hay tareas privadas
- **WHEN** una persona crea una tarea y se asigna a sí misma como responsable
- **THEN** esa tarea aparece igual en la lista que ve cualquier otro miembro del equipo, y no existe ninguna forma de crear una tarea que el resto no pueda ver

#### Scenario: No existe una vista de "mis tareas"
- **WHEN** se busca en la aplicación alguna vista de tareas distinta de la lista del equipo
- **THEN** no existe ninguna separada por persona

#### Scenario: Ver la lista no exige ningún permiso especial
- **WHEN** una persona con sesión iniciada abre la lista
- **THEN** la ve entera, igual que cualquier otro miembro, sin contenido reservado a ningún rol

#### Scenario: Sin sesión no hay lista
- **WHEN** se intenta acceder a la lista sin haber iniciado sesión
- **THEN** no se muestra ninguna tarea

### Requirement: Contenido de cada fila de la lista
El sistema SHALL mostrar en cada tarea de la lista su título, su responsable identificado por su nombre y su estado, sin que haga falta abrirla, y SHALL no mostrar ninguna fecha de vencimiento.

#### Scenario: Título, responsable y estado a la vista
- **WHEN** hay tareas del equipo
- **THEN** cada una muestra su título, quién la lleva y en qué estado está, sin necesidad de abrir ninguna para saberlo

#### Scenario: El responsable se identifica por su nombre
- **WHEN** se lee en una fila quién lleva esa tarea
- **THEN** se ve el nombre de esa persona, nunca su email ni un identificador interno; si esa cuenta no tiene un nombre puesto, la fila muestra "Sin nombre" en su lugar

#### Scenario: La lista no adelanta vencimientos
- **WHEN** se mira cualquier fila de la lista
- **THEN** no aparece ninguna fecha ni ninguna marca de tarea vencida

### Requirement: Consultar la lista no tiene efectos secundarios
El sistema SHALL dejar el estado y el responsable de cada tarea sin cambios por el mero hecho de listarlas o mirarlas.

#### Scenario: Mirar no cambia nada
- **WHEN** se abre la lista y se recorre entera sin realizar ninguna acción sobre sus tareas
- **THEN** ninguna tarea cambia de estado ni de responsable como consecuencia

### Requirement: La lista no muestra señales de presencia
El sistema SHALL no mostrar en la lista quién está conectado en ese momento ni ninguna actividad en vivo por persona.

#### Scenario: Otras personas usando la aplicación a la vez
- **WHEN** otros miembros del equipo están usando la aplicación al mismo tiempo que se mira la lista
- **THEN** la lista no muestra ninguna señal de quién está en línea ni de su actividad

### Requirement: Estado vacío de la lista
El sistema SHALL explicar qué es la lista y SHALL ofrecer crear la primera tarea cuando todavía no existe ninguna, en vez de mostrar una lista vacía sin más contexto.

#### Scenario: Todavía no hay ninguna tarea
- **WHEN** se abre la lista y el equipo no ha creado ninguna tarea todavía
- **THEN** se explica de qué trata la lista y se ofrece crear la primera tarea directamente desde ahí

### Requirement: Crear una tarea pidiendo solo el título
El sistema SHALL permitir crear una tarea nueva a partir únicamente de un título, y SHALL mostrarla en la lista de inmediato tras crearla, sin recargar ni navegar a otra pantalla.

#### Scenario: Un título basta para crear la tarea
- **WHEN** se escribe un título y se confirma la creación
- **THEN** la tarea queda creada sin haber tenido que rellenar ningún otro dato

#### Scenario: Nada más se pide ni se sugiere
- **WHEN** se recorre el flujo de creación de una tarea de principio a fin
- **THEN** el título es lo único que se pide, y en ningún momento se ofrece ni se sugiere indicar responsable, estado o fecha

#### Scenario: La tarea recién creada se ve sin volver a pedirla
- **WHEN** se termina de crear una tarea
- **THEN** esa tarea ya aparece en la lista, sin recargar la página ni navegar a ninguna otra pantalla

### Requirement: Título obligatorio y con contenido real
El sistema SHALL rechazar la creación de una tarea sin título o con un título compuesto únicamente por espacios, SHALL explicar el problema junto al campo, y SHALL rechazar avisando (sin recortarlo en silencio) un título que supere la longitud máxima admitida.

#### Scenario: Crear sin título se rechaza
- **WHEN** se intenta crear una tarea sin haber escrito ningún título
- **THEN** no se crea ninguna tarea y se explica el problema junto al propio campo, en lenguaje corriente

#### Scenario: Un título en blanco no cuenta como título
- **WHEN** se escriben únicamente espacios en el título y se intenta crear la tarea
- **THEN** se rechaza igual que si el campo estuviera vacío, y no aparece en la lista ninguna fila sin texto

#### Scenario: Un título demasiado largo se avisa, no se recorta
- **WHEN** el título escrito supera la longitud máxima que el sistema admite
- **THEN** se avisa de que el título se pasa de largo y no se crea la tarea, y en ningún caso se guarda una versión recortada sin haberlo avisado

### Requirement: Estado y responsable con los que nace una tarea
El sistema SHALL asignar como responsable de una tarea recién creada a quien la crea, y SHALL dejarla en el estado inicial "Pendiente", sin que se haya elegido ninguno de los dos.

#### Scenario: Nace con quien la crea como responsable
- **WHEN** alguien crea una tarea indicando únicamente el título
- **THEN** la tarea queda con esa misma persona como responsable, sin haber seleccionado a nadie en ningún momento

#### Scenario: Nace en "Pendiente"
- **WHEN** alguien crea una tarea indicando únicamente el título
- **THEN** la tarea queda en estado "Pendiente", sin haber elegido el estado en ningún momento

### Requirement: Conjunto cerrado de tres estados
El sistema SHALL restringir el estado de cualquier tarea a exactamente tres valores ("Pendiente", "En curso" y "Hecho"), sin ofrecer ninguna forma de añadir, renombrar o eliminar estados, y SHALL rechazar cualquier otro valor al crear o actualizar una tarea.

#### Scenario: No hay forma de tocar el catálogo de estados
- **WHEN** se busca en la aplicación alguna forma de añadir, renombrar o eliminar un estado
- **THEN** no existe ninguna, y los únicos estados posibles siguen siendo "Pendiente", "En curso" y "Hecho"

#### Scenario: Un estado fuera del catálogo se rechaza
- **WHEN** se intenta crear o actualizar una tarea con un valor de estado que no es ninguno de los tres admitidos
- **THEN** la operación se rechaza y la tarea no queda con ese valor

### Requirement: Cambiar el estado de una tarea desde la lista
El sistema SHALL permitir cambiar el estado de cualquier tarea directamente desde la lista, sin abrirla ni pedir confirmación, y SHALL permitir que cualquier miembro del equipo lo haga con cualquier tarea, sea o no su responsable.

#### Scenario: El cambio se hace sin salir de la lista
- **WHEN** se cambia el estado de una tarea desde la propia lista
- **THEN** el nuevo estado se refleja de inmediato en la vista, sin haber abierto la tarea, confirmado en ningún diálogo ni rellenado ningún otro campo

#### Scenario: Cualquiera puede cambiar el estado de cualquier tarea
- **WHEN** se cambia el estado de una tarea cuyo responsable es otra persona
- **THEN** el cambio se aplica igual que en una tarea propia, sin pedir ningún permiso especial ni mostrar ninguna advertencia

#### Scenario: Los tres estados como único destino posible
- **WHEN** se elige a qué estado cambiar una tarea desde la lista
- **THEN** los únicos destinos ofrecidos son "Pendiente", "En curso" y "Hecho", y al terminar la tarea queda en exactamente uno de ellos

### Requirement: El responsable de una tarea no se reasigna en este change
El sistema SHALL mantener fijo como responsable de una tarea a quien la creó, sin ofrecer ninguna operación para cambiarlo a otra persona.

#### Scenario: No existe forma de reasignar una tarea
- **WHEN** se busca alguna forma de cambiar quién es el responsable de una tarea ya creada
- **THEN** no existe ninguna operación que lo permita, y el responsable sigue siendo quien la creó

### Requirement: Superficie de la API de tareas
El sistema SHALL exponer exactamente tres operaciones sobre tareas: listar todas, crear una y actualizar el estado de una existente; SHALL no exponer la lectura de una tarea suelta, su borrado, ni ninguna operación de equipos o membresías.

#### Scenario: Solo esas tres operaciones existen
- **WHEN** se busca alguna forma de leer una única tarea por separado, de borrar una tarea, o de gestionar equipos o quién pertenece a ellos
- **THEN** ninguna de esas operaciones existe; las únicas disponibles siguen siendo listar todas las tareas, crear una y actualizar su estado
