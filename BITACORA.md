# Bitácora

> Completá este archivo y dejalo en la raíz de tu repositorio.
> **Una página alcanza.** En serio: no buscamos un ensayo, buscamos lo concreto.
> Las tres últimas preguntas son las mismas que vas a tener que pegar en el formulario de entrega, así que escribilas una sola vez, acá.

---

## 1 · Qué hice

Tres o cuatro líneas. Lo que tocaste, en el orden en que lo tocaste.

R: Entender el planteamiento, las reglas.
Ejecutar al azar pruebas y verificar el resultado, hacer cálculos a mano y ver si tiene sentido.
Identificar secciones claves del código, desde lo básico hasta lo que es un poco mas complejo.
Escribir instrucciones claras e ir acompañando con cálculos y verificaciones los resultados.

-

---

## 2 · Qué recorté del alcance, y por qué

Qué decidiste **no** hacer, y con qué criterio. Si tuvieras tres horas más, ¿qué harías primero?
No hace falta que nos digas cuánto tardaste: decinos qué quedó afuera y por qué, que es lo que de verdad nos sirve.
R: Principalmente el diseño de la implementación de la nueva resolución: agregué un modelo simple, funcional, pero no pensé en escalabilidad, arquitectura robusta. Tomé esa decisión pensando en practicidad, algo que va a funcionar sabiendo que puede no escalar o no ser un diseño mas profesional, modular, pero priorizando que funcione, para entender como se aplica la regla, lo mas practico y simple suele ser mas facil de entender cuando se escribe, pero cuando escala y cuando otros intentan leer no suele ser tan amigable.
Si tuviera tres horas mas pensaría en modularizar la nueva resolución, podría ser un dominio nuevo, tiene reglas que sobreescriben configuraciones según ciertas condiciones, así que lo pensaría como una configuración separada, con una asignación 1 a n empresas.
También agregaría mas casos de cobertura para asegurar que no hayan otros casos con posibles inconsistencias con las reglas.

-

---

## 3 · Cómo trabajaste con la IA

La parte que más nos interesa de toda la bitácora. **No queremos la solución: queremos el camino.**

Tres cosas concretas, con ejemplos y no con descripciones generales:

- **Qué le pediste**, y cómo le armaste el contexto antes de pedírselo.
- **En qué momento no le hiciste caso**, y cómo te diste cuenta de que estaba equivocada. Un caso puntual vale más que un párrafo.
- **Qué no le delegás nunca**, y por qué.

> Si mandás el historial de la sesión, decilo acá y no repitas lo que ya está ahí. Y si no usaste IA, también está bien: contanos cómo trabajaste.

R: Primero escribí en un documento un contexto base, con reglas técnicas y de negocio, el resultado esperado, el alcance de lo que se va a hacer y restricciones explícitas, lo que no se va a hacer y qué cosas no debe modificar.

Creé un agente custom al que le di las instrucciones de cómo ejecutar y el contexto, así como indicar permisos explícitamente para limitar las acciones a lo que es relevante al proyecto.

En cada ejecución se invocó al agente así que no fue necesario darle las instrucciones específicas en cada ejecución porque ya lo tenía en el contexto, esto facilita escribir instrucciones y tareas a realizar ya que me enfoqué en las instrucciones directamente y no en el contexto o restricciones.

En un momento cuando le pedí que se aplique la resolución nueva noté que algo no salió bien, algunos tests preexistentes tenían resultados distintos tras aplicar los cambios, constantemente fui ejecutando tests y probando casos cuyos resultados tenía anotado para ir comprobando que todo siga igual, salvo los casos nuevos con la nueva regla aplicada. Entonces noté que faltó algo de precisión en mi instrucción: no se deben modificar tests preexistentes y creé una nueva empresa para no afectar las empresas configuradas previamente, no estuvo mal la aplicación de la regla si no que la intervención en tests y configuración de empresas preexistentes.
La solución fue volver atrás, restaurar al checkpoint antes de la implementación de la regla, modificar la instrucción con la precición deseada y la implementación fue correcta.

No le delego la aprobación automática para ejecutar comandos, normalmente le configuro permisos automático a solamente lo básico (ejecutar tests, build, typecheck), limito a lo mínimo, para estar siempre pendiente de lo que va realizando.
Nunca le dejo revisar datos sensibles, como contraseñas, apikeys, permitir instalar librerías o plugins automáticamente.
Creo que allí prima el sentido común, denegar datos sensibles, no permitir acciones automáticas a no ser que uno esté consciente de lo que le permite, limitar siempre, permitir lo conocido.

-

---

## 4 · Qué parte de mi solución no me da confianza

Qué dejaste con dudas, qué no llegaste a verificar, qué te parece frágil.
Decir "esto no lo entendí y no quise adivinar" es una respuesta válida y buena.

R: La implementación de la nueva regla, puede tener huecos, no pude probar muchos casos como quisiera y el diseño es fragil.
Creo que para escribir un código que aplica fórmulas, que impacta en dinero, que se rige por normativas, en donde un error impacta en multas, uno debe estudiarlo muy bien y saber hacerlo a mano, tener muy en claro para después trasladarlo a código, así únicamente podría tener el criterio para identificar posibles fallas, huecos, casos bordes, etc.

-

---

## Preguntas o comentarios sobre el ejercicio

Opcional. Si algo del enunciado, del README o de la resolución te pareció ambiguo, mal escrito o directamente equivocado, este es el lugar.

R: Me pareció muy divertido, me entusiasmó y perdí un poco la noción de la hora.
En general está bien claro y conciso.
Algo que me generó dudas fue el Articulo 3 de la resolución, cómo impacta la normativa al recargo, pero logré deducir tras una breve investigación.

-
