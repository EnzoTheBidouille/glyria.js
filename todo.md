# Glyria.js — TODO

Framework de bot Discord basé sur discord.js.

> État actuel (js.glyria.app) : commandes file-based, sous-commandes/groupes, auto-imports globaux, Embed V2 builder, replies stylées (`ctx.g.reply.success/error/info`) via `createReplyableContext(message)`, GlyriaBus, CLI (init/dev/build/start/generate), config thème.

## 🤯 Features "à couper le souffle"
- [ ] **Studio web intégré (`glyria studio`)** : une UI locale (type Storybook/Prisma Studio) qui liste toutes tes commandes/composants/modules, permet de les exécuter et voir le rendu Discord *sans ouvrir Discord* — preview live des embeds/boutons pendant que tu codes
- [ ] **Zero-downtime hot-reload en prod** : remplacement des handlers de commandes en mémoire pendant que le process tourne (pas juste en dev), le bot ne redémarre jamais pour un déploiement de code
- [ ] **Time-travel debugging** : chaque interaction est enregistrée (payload + état du contexte) et rejouable à volonté (`glyria replay <interactionId>`) pour débugger un bug signalé par un user sans pouvoir le reproduire
- [ ] **Load-test simulator** : `glyria bench` simule des milliers d'interactions concurrentes contre ton bot en local pour trouver les goulots d'étranglement avant la prod
- [ ] **Auto-changelog Discord** : à chaque déploiement, le bot poste automatiquement dans un salon un résumé lisible des commandes/modules ajoutés/modifiés/supprimés (diff généré depuis git)
- [ ] **Self-healing process** : détection de crash-loop, rollback automatique vers la dernière version stable des commandes enregistrées, avec état de session préservé (Redis/disque) pour ne perdre aucune interaction en cours
- [ ] **Génération de visuels dynamiques intégrée** : un moteur de canvas/SVG→PNG livré nativement (`ctx.g.canvas.rankCard()`, `.leaderboard()`) sans avoir à brancher `canvas`/`sharp` soi-même, avec attach direct dans `ctx.g.reply`

## 💎 Features pépites (différenciantes)
- [ ] **`ctx.g.paginate()`** : pagination Embed V2 native en une ligne, boutons précédent/suivant auto-gérés, timeout auto-disable
- [ ] **`ctx.g.confirm()`** : popup confirmation oui/non en une ligne, retourne une Promise<boolean>, basé sur Embed V2
- [ ] **Cooldowns déclaratifs** : `.setCooldown("5s")` ou `.setCooldown({ user: "5s", guild: "2s" })` directement sur `GlyriaCommand`, comme `.setName()`
- [ ] **Permissions déclaratives** : `.setPermissions(["BanMembers"])` / `.setOwnerOnly(true)` avec message d'erreur stylé automatique via `ctx.g.reply.error`
- [ ] **Autocomplete typé** : `.addStringOption(o => o.setAutocomplete(async (query, ctx) => [...]))` — auto-inféré, pas de handler séparé à écrire
- [ ] **Store intégré (`ctx.g.store`)** : mini state management par guild/user (Map en mémoire + adaptateur pluggable SQLite/Redis) sans configurer de DB à la main
- [ ] **Watch mode intelligent** : rechargement à chaud qui ne re-register sur Discord que les commandes qui ont réellement changé (diff), pas tout le tableau à chaque save
- [ ] **Typage bout-en-bout des interactions custom** : `customId` typés (TS infère les params encodés dedans, genre `role_picker:${roleId}`) pour éviter le parsing manuel de string

## 🧱 Modules & SDK (`/sdk`)
- [ ] **Refonte du système de modules actuel** : chaque module = un dossier autonome (`commands/`, `events/`, `components/`, `schema.ts`) chargé dynamiquement, plus de fichiers éparpillés à la main
- [ ] **`glyria.module.ts`** : fichier manifeste par module (nom, version, dépendances vers d'autres modules, permissions requises, config par défaut) — un peu comme un `package.json` scoppé au module
- [ ] **SDK `/sdk`** : package interne exposant les primitives pour construire un module (`defineModule()`, `defineCommand()`, `defineEvent()`, `defineHook()`) avec types stricts, généré à `glyria init` dans un dossier `/sdk` du projet, éditable et extensible par l'utilisateur
- [ ] **`defineModule({ name, setup, hooks })`** : point d'entrée unique d'un module, `setup(ctx)` reçoit un contexte scoppé (accès au client, au store, au logger, à `ctx.g`, à la config du module uniquement)
- [ ] **Système de hooks de cycle de vie** : `onLoad`, `onReady`, `onUnload`, `onCommandRun`, `onError`, `onGuildJoin/Leave` — enregistrables depuis n'importe quel module via le SDK, sans toucher au core
- [ ] **Hooks d'interception (middleware global)** : `beforeCommand(ctx, next)` / `afterCommand(ctx, result, next)` exposés par le SDK pour qu'un module puisse s'insérer dans le pipeline d'exécution de tous les autres modules (ex: module de logging, module d'anti-spam) — même signature de `ctx` que le Replyable Context
- [ ] **Isolation & sandboxing des modules** : un module qui crash ne doit pas crasher le bot entier (try/catch automatique autour de chaque hook + désactivation auto du module fautif avec log clair via `ctx.g.log`)
- [ ] **Résolution de dépendances entre modules** : un module peut déclarer `dependsOn: ["economy"]`, le loader résout l'ordre de chargement et bloque si une dépendance manque
- [ ] **Config par module typée** : `defineModule({ config: z.object({...}) })` avec Zod (ou équivalent), génère un fichier de config validé automatiquement par module dans `glyria.config.ts`
- [ ] **Hot-swap de module isolé** : recharger un seul module en mémoire (ses commandes, events, hooks) sans toucher aux autres ni redémarrer le bot
- [ ] **CLI `glyria module create <nom>`** : scaffold un nouveau module complet dans `/sdk/modules/<nom>` avec le manifeste, un exemple de commande, d'event et de hook
- [ ] **Publication NPM standard** : un module `/sdk` n'est qu'un package NPM normal (le SDK génère juste le bon `package.json` + build config) — `npm publish` suffit, pas de marketplace ni d'infra dédiée à maintenir
- [ ] **Installation d'un module externe** : `npm install <module>` puis simple ajout dans `glyria.config.ts` (`modules: ["mon-module-npm"]`) pour l'activer, le loader le résout comme un module local
- [ ] **Registry local de modules (`glyria module list`)** : liste les modules chargés (locaux ou npm), leur statut (actif/désactivé/erreur), leurs hooks enregistrés — utile en debug
- [ ] **Permissions inter-modules** : un module peut exposer une API interne consommable par d'autres modules (`ctx.modules.get("economy").addBalance(...)`) avec typage généré automatiquement
- [ ] **Tests unitaires pour modules** : helper SDK `createTestContext()` pour tester un module (commande/hook) hors Discord, façon `@testing-library` — même fonction sous-jacente que le futur remplacement de `createReplyableContext()`

## 🧠 Amélioration du Replyable Context (`ctx.g`)
- [ ] **Suppression du `createReplyableContext(message)` manuel** : le contexte doit être injecté automatiquement par le framework (déjà présent dans les params de la commande/event/component/hook de module), plus besoin d'appeler soi-même `createReplyableContext()` dans chaque handler
- [ ] **`ctx.g` disponible nativement partout** : dans les commandes (slash + legacy), les events, les components (boutons/selects/modals) et les modules — un seul objet cohérent quel que soit le déclencheur, au lieu de recréer le contexte à la main selon les cas
- [ ] **Auto-détection de la source (`message` vs `interaction`)** : la construction interne du contexte gère elle-même si c'est un `Message` ou une `Interaction` et expose la même API `ctx.g.reply.*`, sans que le dev ait à faire la distinction
- [ ] **Chaînage complet des réponses** : `ctx.g.reply.success("Titre").description("...").field("Champ", "Valeur").send()` — builder fluide plutôt qu'un objet unique passé d'un coup
- [ ] **Édition native de la dernière réponse** : `ctx.g.edit()` qui retrouve automatiquement le dernier message envoyé par le contexte (plus besoin de stocker le message manuellement pour l'éditer après)
- [ ] **Réponses différées intelligentes** : `ctx.g.defer()` auto-détecté selon le temps d'exécution estimé (defer automatique si la commande dépasse ~2s au lieu de le faire à la main à chaque fois)
- [ ] **Followups typés** : `ctx.g.followUp.success()` / `.error()` avec le même styling que `reply`, pour les réponses multiples sans réécrire toute la logique d'embed
- [ ] **`ctx.g.reply.raw()`** : sortie d'échappement pour envoyer un message Discord.js brut (embed classique, pas Embed V2) quand on veut sortir du système stylé
- [ ] **Réponses éphémères par défaut configurables** : `ctx.g.ephemeral(true)` global par commande ou par module, plutôt que de le repréciser à chaque `reply`
- [ ] **`ctx.g.reply.loading()`** : état de chargement stylé auto-remplacé par le résultat final une fois la promesse résolue (`await ctx.g.reply.loading("Recherche...", fetchData())`)
- [ ] **Attachments fluides** : `ctx.g.reply.success().file(buffer, "rank.png")` intégré au chaînage, avec support direct du moteur de canvas (`ctx.g.canvas.rankCard()` → `.attach()`)
- [ ] **Contexte enrichi automatique** : `ctx.g` expose directement `ctx.g.user`, `ctx.g.member`, `ctx.g.guildConfig` déjà résolus (plus de `interaction.user` / fetch manuel du membre/config)
- [ ] **Réponses conditionnelles selon le canal d'origine** : le même `ctx.g.reply` s'adapte automatiquement (ephemeral en DM, normal en guild, fallback texte si Components V2 non supporté)
- [ ] **Historique de contexte accessible** : `ctx.g.history()` pour retrouver les réponses précédentes envoyées dans la même interaction/session (utile pour les flows multi-étapes : confirm → paginate → reply)
- [ ] **Hooks sur le contexte lui-même** : `ctx.g.onSend((message) => {...})` pour brancher du logging/analytics sur chaque réponse envoyée, sans dupliquer du code dans chaque commande — s'intègre au système de hooks des modules
- [ ] **`ctx.g.log()`** : logger stylé qui poste aussi dans un salon Discord de logs configuré (erreurs, commandes sensibles), sans setup manuel de webhook
- [ ] **Typage strict du contexte selon le type d'interaction** : `ctx.g` a des méthodes différentes (et typées) selon que ce soit un slash command, un bouton, un modal, un select menu ou un hook de module — pas un objet générique fourre-tout