## MODIFIED Requirements

### Requirement: Superficie de la API de tareas
El sistema SHALL exponer exactamente cuatro operaciones sobre tareas: listar todas, crear una, consultar una tarea suelta y actualizar una existente (su estado, su fecha de vencimiento, o ambas); SHALL no exponer el borrado de una tarea ni ninguna operación de equipos o membresías.

#### Scenario: Consultar una tarea suelta
- **WHEN** se pide el detalle de una tarea concreta
- **THEN** se devuelven sus datos, incluida su fecha de vencimiento si la tiene

#### Scenario: Consultar una tarea que no existe
- **WHEN** se pide el detalle de una tarea con un identificador que no corresponde a ninguna
- **THEN** se indica que no existe, en vez de devolver una tarea inventada o vacía

#### Scenario: Solo esas tres operaciones existen
- **WHEN** se busca alguna forma de borrar una tarea, o de gestionar equipos o quién pertenece a ellos
- **THEN** ninguna de esas operaciones existe; las únicas disponibles siguen siendo listar todas las tareas, crear una, consultar una suelta y actualizarla

### Requirement: Contenido de cada fila de la lista
El sistema SHALL mostrar en cada tarea de la lista su título, su responsable identificado por su nombre y su estado, sin que haga falta abrirla, y SHALL no exponer ninguna fecha de vencimiento en la lista, ni en pantalla ni en la respuesta que la alimenta.

#### Scenario: Título, responsable y estado a la vista
- **WHEN** hay tareas del equipo
- **THEN** cada una muestra su título, quién la lleva y en qué estado está, sin necesidad de abrir ninguna para saberlo

#### Scenario: El responsable se identifica por su nombre
- **WHEN** se lee en una fila quién lleva esa tarea
- **THEN** se ve el nombre de esa persona, nunca su email ni un identificador interno; si esa cuenta no tiene un nombre puesto, la fila muestra "Sin nombre" en su lugar

#### Scenario: La lista no adelanta vencimientos
- **WHEN** se mira cualquier fila de la lista, o se inspecciona la respuesta que la alimenta
- **THEN** no aparece ninguna fecha ni ninguna marca de tarea vencida en ningún sitio

## ADDED Requirements

### Requirement: Una tarea nace sin fecha de vencimiento
El sistema SHALL crear toda tarea nueva sin fecha de vencimiento.

#### Scenario: Nace sin fecha
- **WHEN** se crea una tarea indicando únicamente el título
- **THEN** queda sin fecha de vencimiento

### Requirement: Poner, cambiar o quitar la fecha de vencimiento de una tarea
El sistema SHALL permitir que cualquier miembro del equipo ponga, cambie o quite la fecha de vencimiento de cualquier tarea, sea o no su responsable; SHALL aceptar una fecha ya pasada sin bloquearla; SHALL aplicar la retirada de la fecha de inmediato, sin pedir confirmación; y SHALL rechazar una fecha que no sea válida explicando el problema junto al campo, dejando intacta la fecha que la tarea tuviera antes.

#### Scenario: Poner una fecha a una tarea que no la tenía
- **WHEN** se le indica una fecha a una tarea sin fecha
- **THEN** la tarea queda con esa fecha

#### Scenario: Cambiar la fecha de una tarea que ya la tenía
- **WHEN** se le indica una fecha distinta a una tarea que ya tenía una
- **THEN** la tarea queda con la nueva fecha

#### Scenario: Quitar la fecha sin confirmación
- **WHEN** se quita la fecha de una tarea que la tenía
- **THEN** la tarea se queda sin fecha de inmediato, sin ningún diálogo de confirmación de por medio

#### Scenario: Cualquiera puede tocar la fecha de cualquier tarea
- **WHEN** se pone, cambia o quita la fecha de una tarea cuyo responsable es otra persona
- **THEN** el cambio se aplica igual que en una tarea propia, sin pedir ningún permiso especial

#### Scenario: Una fecha ya pasada se acepta
- **WHEN** se pone una fecha anterior al día de hoy
- **THEN** el sistema la acepta sin impedirlo

#### Scenario: Una fecha inválida no se traga en silencio
- **WHEN** se intenta poner una fecha que no existe o está incompleta
- **THEN** la tarea conserva la fecha que tuviera antes, y se explica el problema junto al propio campo, en lenguaje corriente

### Requirement: Regla de tarea vencida
El sistema SHALL considerar vencida una tarea exactamente cuando tiene fecha de vencimiento, esa fecha es anterior al día de hoy, y la tarea no está en estado "Hecho"; SHALL no considerar vencida nunca a una tarea sin fecha; SHALL dejar de considerarla vencida en cuanto pasa a "Hecho", sin alterar la fecha guardada; y SHALL resolver "el día de hoy" según el día de quien mira, no un día único para todo el mundo.

#### Scenario: Vencer hoy todavía no es estar vencida
- **WHEN** la fecha de vencimiento de una tarea no hecha es el día de hoy
- **THEN** no se muestra como vencida

#### Scenario: Una fecha futura nunca está vencida
- **WHEN** la fecha de vencimiento de una tarea es posterior al día de hoy
- **THEN** no se muestra como vencida

#### Scenario: Sin fecha no se vence nunca
- **WHEN** una tarea no tiene fecha de vencimiento, sin importar cuánto tiempo lleve pendiente
- **THEN** no se muestra como vencida

#### Scenario: Pasar a "Hecho" destranca el vencimiento
- **WHEN** una tarea vencida pasa a estado "Hecho"
- **THEN** deja de mostrarse como vencida, y su fecha de vencimiento no cambia

#### Scenario: Una tarea ya hecha con la fecha pasada no está vencida
- **WHEN** se mira una tarea en estado "Hecho" cuya fecha de vencimiento ya pasó
- **THEN** no se muestra como vencida

#### Scenario: Aplazar la fecha resuelve el vencimiento
- **WHEN** la fecha de vencimiento de una tarea vencida se cambia a una posterior al día de hoy
- **THEN** deja de mostrarse como vencida

#### Scenario: Cada persona ve el vencimiento según su propio día
- **WHEN** dos personas en husos horarios distintos miran la misma tarea en el mismo instante, y para una ya pasó la fecha de vencimiento mientras que para la otra todavía es hoy
- **THEN** la primera la ve vencida y la segunda no, y las dos lecturas son correctas

#### Scenario: Una tarea vence sola, sin que nadie la toque
- **WHEN** pasa la medianoche en el huso horario de quien mira una tarea con fecha de hoy y no hecha, y esa persona vuelve a mirarla
- **THEN** aparece como vencida, sin que nadie haya modificado la tarea

### Requirement: Abrir una tarea para ver o cambiar su fecha de vencimiento
El sistema SHALL permitir abrir cualquier tarea de la lista para ver su fecha de vencimiento (o su ausencia) y si está vencida, y para ponerla, cambiarla o quitarla desde ahí mismo; esa apertura SHALL alcanzarse y cerrarse solo con teclado; SHALL no cambiar nada de la tarea por el mero hecho de abrirla y cerrarla sin tocar nada; y SHALL exigir haber iniciado sesión para ver ese contenido.

#### Scenario: Se abre desde la lista y se vuelve a ella
- **WHEN** se abre una tarea desde la lista y luego se cierra
- **THEN** se vuelve a ver la lista

#### Scenario: Se abre y se cierra sin ratón
- **WHEN** se usa únicamente el teclado
- **THEN** es posible abrir una tarea, ver o cambiar su fecha, y volver a la lista, igual que con el ratón

#### Scenario: Abrir sin tocar nada no cambia nada
- **WHEN** se abre una tarea y se cierra sin modificar su fecha
- **THEN** esa tarea no cambia de estado, de responsable ni de fecha

#### Scenario: Se puede abrir cualquier tarea, sea de quien sea
- **WHEN** se abre una tarea cuyo responsable es otra persona
- **THEN** se ve igual que si fuera propia, sin advertencia ni permiso especial

#### Scenario: Sin sesión no se ve el contenido
- **WHEN** se intenta abrir una tarea sin haber iniciado sesión
- **THEN** no se ve su contenido

#### Scenario: Una tarea sin fecha se ve como algo normal
- **WHEN** se abre una tarea que no tiene fecha de vencimiento
- **THEN** no aparece ningún aviso, recordatorio ni señal de que le falte algo

#### Scenario: La condición de vencida se entiende sin hacer cuentas
- **WHEN** se abre una tarea vencida
- **THEN** su condición de vencida se comunica con una señal propia, sin que quien mira tenga que comparar la fecha con la de hoy
