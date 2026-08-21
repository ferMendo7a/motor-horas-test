# Prompt de especificaciones técnicas para ejecución de instrucciones

## Descripción
Documentación base para consideraciones técnicas y reglas, con alcance y restricciones para ejecutar instrucciones a través de agentes LLM.

## Reglas de negocio
- Las reglas de negocio están descritas en README.md, en el bloque 'Las reglas' es la principal fuente de verdad, el código puede estar incorrecto, asumir que las reglas descritas en el README.md es el primer orden de validez de cualquier desición, se debe considerar con absoluta minuciosidad cada regla escrita allí, sin modificarla y adaptando cualquier instrucción a las reglas indicadas.
- El objetivo principal es resolver las tareas indicadas en CONSIGNA.md, limitar alcance de resolución a lo solicitado.

## Reglas técnicas
- Toda modificación en el código o código nuevo agregado debe estar escrito en typescript.
- Limitarse a utilizar las dependencias existentes en el package.json, sin agregar ninguna nueva.
- Todo el código debe ser compatible con lo explícitamente definido en el package.json y tsconfig.json.
- Ejecutar suite de tests y typecheck luego de cualquier modificación de código:
```
  npm test
  npm run typecheck
```
