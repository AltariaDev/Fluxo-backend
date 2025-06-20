v.0.0.5
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod

# MongoDB image
$ docker-compose up -d
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

**REQUESITOS FUNCIONALES:**

- Calendario Mensual:
  - La aplicación debe permitir visualizar un calendario mensual.
  - Los usuarios deben poder agregar eventos, tareas y recordatorios a las fechas correspondientes.
  - Los eventos deben poder modificarse o eliminarse.
- Calendario Semanal:
  - La aplicación debe permitir visualizar una vista semanal del calendario.
  - Los usuarios deben poder agregar, editar o eliminar tareas y eventos en cualquier de la semana.
- Agenda diaria:
  - La aplicación debe permitir visualizar una vista diaria del calendario.
  - La aplicación debe permitir crear una agenda diaria.
  - Los usuarios deben poder ver las tareas del día, ordenadas por hora o prioridad.
  - Los usuarios deben poder marcar tareas como completadas, y eliminar tareas.
- Check List:
  - Los usuarios deben poder registar tareas diarias que forman parte de un hábito.
  - La aplicación debe registar el progreso diaria, si se completó o no la tarea.
  - Los usuarios deben poder ver gráficos o estadísticas de su constancia en el tiempo.
  - Los hábitos no se marcan manualmente, se hace de manera automática al completar tareas relacionadas.
- Diccionario personal (Glosario):
  - Los usuarios deben poder agregar palabras y sus definiciones.
  - El diccionario debe permitir consultar las palabras por nombre o categoría.
  - Los usuarios deben poder organizar las palabras alfabéticamente, por tema o cualquier otro parámetro.
- Tabla de seguimiento de temas:
  - Los usuarios deben poder añadir y realizar un seguimiento de los temas que están trabajando o estudiando.
  - Deben poder agregar notas, fechas de inicio y final, y el progreso de cada tema.
- Cronómetro:
  - La aplicación debe permitir usar un cronómetro para medir el tiempo dedicado a cada tema o actividad.
  - Los usuarios deben poder iniciar, pausar, reanudar y detener el cronómetro.
  - Los tiempos deben ser registrados y asociados a los temas/tareas, para permitirle al usuario tener un control sobre el tiempo dedicado por tarea.
  - El cronómetro puede ser compartido con amigos en la misma sesión, de forma que todos vean el mismo tiempo.
- Temporizador:
  - La apliación debe permitir configurar un temporizador para realizar simulacros o tareas con tiempo limitado.
  - Los usuarios deben poder configurar el tiempo de duración del temporizador.
  - El temporizador puede ser compartido con amigos en la misma sesión, de forma que todos vean el mismo tiempo.
  - La aplicación debe darle la opción al usuario de tener temporizadores predefinidos para realizar estudiar según la metodología "pomodoro", con tiempos de estudio variables en función de los descansos.
- Estadisticas de puntuación de Test:
  - La aplicación debe permitir registar y visualizar las puntuaciones de los tests realizados.
  - Los usuarios deben poder consultar las estadísticas de los tests, incluyendo la evolución a lo largo del tiempo y poder hacer un seguimiento de su trabajo.
- IA para organización de Trabajo y estudio (Ultima funcionalidad a añadir):
  - La aplicación debe incorporar una funcionalidad de IA para sugerir la organización de tareas, estudios o temas.
  - La IA debe recomendar tiempos de estudio, tareas a priorizar, orden de los temarios y otros aspectos de gestión personal de la materia.
- Recordatorios:
  - Los usuarios deben poder configurar recordatorios de exámenes y convocatorias importantes.
  - Los recordatorios deben incluir la fecha, hora y detalles del examen.
  - La aplicación debe poder recoger la información de los exámenes y añadirla a los recordatorios de los usuarios.
- Sistema de gamificación:
  - Los usuarios pueden ganar puntos de experiencia al completar tareas o alcanzar objetivos.
  - Los puntos de xp deben permitir subir de nivel y desbloquear mejoras para el perfil del usuario.
  - Los usuarios pueden personalizar su perfil (cambios en el avatar, mascotas, marcos de perfil, fondos, etc.) con las mejoras obtenidas.
  - Los niveles del usuario y los puntos de xp deben reflejarse de forma visible y motivadora en cada perfil.
- Salas de Estudio:
  - El usuario debe poder crear una sala de estudio con un nombre específico.
  - Al crear la sala, el usuario puede definir algunas configuraciones iniciales: tema de estudio, duración de pomodoros, accesibilidad de la sala (oculta, privada, pública).
  - El usuario puede unirse a una sala en tiempo real dónde poder estudiar, buscando salas públicas o uniendose a una privada con enlace de invitación o código.
  - Los usuarios deben poder comunicarse entre ellos mediante un chat en vivo.
  - Los usuarios tendrán a su disposición herramientas de estudio colaborativas, lista de tareas, tablero de notas, temporizadores. El tiempo de estudio se debe considerar individualmente para cada uno.
