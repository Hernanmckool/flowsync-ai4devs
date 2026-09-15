# Cuentas y acceso

## Purpose

Permitir que una persona cree una cuenta, inicie sesión, mantenga una sesión activa entre recargas y cierre sesión, y evitar que quien no tiene sesión válida acceda a las páginas o datos protegidos de la aplicación.

## Requirements

### Requirement: Registro de una cuenta nueva
El sistema SHALL permitir crear una cuenta nueva a partir de un email, una contraseña y su confirmación, y SHALL entregar de inmediato un token de acceso y los datos de la cuenta creada.

#### Scenario: Registro con datos válidos
- **WHEN** se envían un email no usado antes, una contraseña de entre 8 y 32 caracteres y una confirmación idéntica a esa contraseña
- **THEN** la cuenta queda creada y la respuesta incluye un token de acceso junto con el id, el nombre completo, el email, las iniciales y las fechas de alta y de última actualización de la cuenta

#### Scenario: El nombre completo es opcional
- **WHEN** se envía el registro sin un nombre completo (el valor del campo es nulo)
- **THEN** la cuenta se crea igualmente y sus iniciales se calculan a partir del email

#### Scenario: Email ya registrado
- **WHEN** se intenta registrar una cuenta con un email que ya pertenece a otra cuenta
- **THEN** el registro se rechaza y no se crea ninguna cuenta ni se entrega ningún token

#### Scenario: Contraseña y confirmación no coinciden
- **WHEN** la confirmación de la contraseña no es igual a la contraseña enviada
- **THEN** el registro se rechaza y no se crea ninguna cuenta

#### Scenario: Contraseña fuera del rango permitido
- **WHEN** la contraseña enviada tiene menos de 8 caracteres o más de 32
- **THEN** el registro se rechaza

#### Scenario: Email con formato inválido
- **WHEN** el email enviado no tiene forma de dirección de correo válida
- **THEN** el registro se rechaza

### Requirement: Inicio de sesión con email y contraseña
El sistema SHALL permitir iniciar sesión con un email y una contraseña existentes, y SHALL entregar un token de acceso y los datos de la cuenta cuando las credenciales son correctas.

#### Scenario: Inicio de sesión con credenciales correctas
- **WHEN** se envían el email y la contraseña de una cuenta existente y coinciden
- **THEN** se entrega un nuevo token de acceso junto con los datos de esa cuenta

#### Scenario: Credenciales incorrectas
- **WHEN** la contraseña enviada no corresponde a la del email indicado, o el email no pertenece a ninguna cuenta
- **THEN** el inicio de sesión se rechaza con el mismo mensaje genérico en ambos casos, sin indicar cuál de los dos datos es el incorrecto

### Requirement: Consulta del perfil de la cuenta autenticada
El sistema SHALL exponer los datos de la cuenta asociada a un token de acceso válido, y SHALL rechazar la consulta cuando no se presenta un token válido.

#### Scenario: Consulta con un token válido
- **WHEN** se solicita el perfil presentando un token de acceso vigente
- **THEN** se devuelven el id, el nombre completo, el email, las iniciales y las fechas de alta y de última actualización de la cuenta dueña de ese token

#### Scenario: Consulta sin token o con un token no reconocido
- **WHEN** se solicita el perfil sin presentar ningún token, o presentando uno que no existe o ya no es válido
- **THEN** la consulta se rechaza y no se revela ningún dato de ninguna cuenta

### Requirement: Cierre de sesión
El sistema SHALL permitir invalidar el token de acceso con el que se cerró sesión, de forma que deje de servir para autenticar peticiones posteriores.

#### Scenario: Cierre de sesión con un token válido
- **WHEN** se pide cerrar sesión presentando un token de acceso vigente
- **THEN** la operación se confirma y ese mismo token deja de ser válido para cualquier petición posterior que lo use

#### Scenario: Cierre de sesión sin sesión activa
- **WHEN** se pide cerrar sesión sin presentar ningún token, o presentando uno que no es válido
- **THEN** la operación se rechaza igual que cualquier otra petición sin autenticar

### Requirement: Pantallas de registro e inicio de sesión
El sistema SHALL ofrecer una pantalla de registro y una de inicio de sesión, cada una con un enlace a la otra, y SHALL impedir que alguien con sesión activa vuelva a verlas.

#### Scenario: Pantalla de inicio de sesión
- **WHEN** una persona sin sesión activa abre la pantalla de inicio de sesión
- **THEN** ve un formulario con los campos de email y contraseña, un botón para entrar y un enlace hacia la pantalla de registro

#### Scenario: Pantalla de registro
- **WHEN** una persona sin sesión activa abre la pantalla de registro
- **THEN** ve un formulario con los campos de nombre completo (marcado como opcional), email, contraseña y confirmación de contraseña, un botón para crear la cuenta y un enlace hacia la pantalla de inicio de sesión

#### Scenario: Registro con las contraseñas distintas, antes de contactar con el servidor
- **WHEN** en el formulario de registro la contraseña y su confirmación no coinciden y se intenta enviar el formulario
- **THEN** se muestra de inmediato un aviso bajo el campo de confirmación sin haber llamado al servidor, y la cuenta no se crea

#### Scenario: Se impide ver login o registro con sesión activa
- **WHEN** una persona con sesión activa intenta abrir la pantalla de login o la de registro
- **THEN** es enviada automáticamente a la pantalla de perfil en su lugar

#### Scenario: Entrada al sistema tras un registro o inicio de sesión correctos
- **WHEN** el registro o el inicio de sesión terminan con éxito
- **THEN** la persona es llevada automáticamente a la pantalla de perfil

### Requirement: Aviso de errores en los formularios de acceso
El sistema SHALL mostrar en castellano y de forma comprensible cualquier error que impida completar el registro o el inicio de sesión, señalando el campo concreto siempre que el error corresponda a uno visible en el formulario.

#### Scenario: Error asociado a un campo visible
- **WHEN** el servidor rechaza el formulario por un problema de un campo que está en pantalla (por ejemplo, un email con formato inválido o ya registrado, una contraseña demasiado corta, o una confirmación que no coincide)
- **THEN** el mensaje correspondiente aparece junto a ese campo, en castellano

#### Scenario: Error sin campo asociado
- **WHEN** el inicio de sesión se rechaza por credenciales incorrectas, o el servidor no responde
- **THEN** se muestra un único aviso general en la parte superior del formulario, en vez de señalar un campo concreto

#### Scenario: Envío en curso
- **WHEN** se envía el formulario de registro, de inicio de sesión o el cierre de sesión
- **THEN** el botón de la acción se deshabilita y cambia su texto para indicar que la operación está en curso

### Requirement: Protección de las páginas según el estado de la sesión
El sistema SHALL impedir el acceso a páginas que requieren sesión a quien no la tiene, SHALL mantener a alguien con sesión válida fuera de las páginas exclusivas de personas sin sesión, y SHALL evitar decidir cualquiera de las dos cosas mientras el estado de la sesión todavía se está determinando.

#### Scenario: Acceso a una página protegida sin sesión
- **WHEN** una persona sin sesión activa intenta abrir la página de perfil
- **THEN** es enviada a la pantalla de inicio de sesión

#### Scenario: Estado de sesión aún sin determinar
- **WHEN** la aplicación todavía está comprobando si hay una sesión activa
- **THEN** se muestra una pantalla de carga en lugar de la página de destino, y no se produce ninguna redirección todavía

#### Scenario: Ruta desconocida
- **WHEN** se visita una dirección de la aplicación que no corresponde a ninguna pantalla
- **THEN** la persona termina en la pantalla de perfil si tiene sesión activa, o en la de inicio de sesión si no la tiene

### Requirement: Persistencia de la sesión entre recargas
El sistema SHALL recordar la sesión de una persona tras recargar la página o volver a abrir la aplicación, siempre que el servidor siga reconociendo esa sesión como válida.

#### Scenario: Recarga con una sesión que el servidor sigue reconociendo
- **WHEN** se recarga la aplicación teniendo una sesión previa que el servidor todavía acepta
- **THEN** la sesión se restablece sin pedir de nuevo email ni contraseña

#### Scenario: Recarga con una sesión que el servidor ya no reconoce
- **WHEN** se recarga la aplicación teniendo una sesión previa que el servidor ya no acepta
- **THEN** la sesión se da por finalizada, la persona termina en la pantalla de inicio de sesión y ve explicado que su sesión anterior ya no es válida

### Requirement: Página de perfil y cierre de sesión desde la interfaz
El sistema SHALL mostrar en la página de perfil los datos de la cuenta con sesión activa, y SHALL ofrecer una acción para cerrar sesión que siempre termine la sesión localmente.

#### Scenario: Contenido de la página de perfil
- **WHEN** una persona con sesión activa abre la página de perfil
- **THEN** ve sus iniciales, su nombre completo (o una indicación de que no tiene nombre registrado), su email y la fecha en la que se dio de alta

#### Scenario: Cierre de sesión desde la página de perfil
- **WHEN** se pulsa el botón de cerrar sesión en la página de perfil
- **THEN** la sesión local se termina y la persona es enviada a la pantalla de inicio de sesión, incluso si el servidor no llega a confirmar el cierre de sesión
