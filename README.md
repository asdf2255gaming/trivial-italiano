# Trivial Italiano

Gioco a quiz in stile Trivial da giocare in gruppo su un unico schermo, **completamente offline**.
Si gira la ruota, si risponde a domande a scelta multipla e si conquistano gli spicchi.

## Caratteristiche

- **660 domande** in 6 categorie: Cinema e musica, Scienza, Geografia, Sport, Arte e letteratura, Storia
  (per ognuna 20 facili, 20 medie e 70 difficili).
- **Da 2 a 10 giocatori o squadre.**
- **Tre modalità**: Studente (solo domande facili), Classica (si sceglie la difficoltà a ogni turno),
  Esperto (solo domande difficili).
- **Punteggio**: 10 punti per ogni risposta giusta e 30 di bonus a chi conquista per primo tutti gli spicchi.
- **Fine partita a scelta**: quando una squadra completa la ruota oppure quando raggiunge un punteggio
  obiettivo. In entrambi i casi si finisce il giro, così tutti hanno gli stessi turni, e vince chi ha più punti.
- **Domande che non si ripetono** nella stessa partita.
- **Partita salvata automaticamente**: se si chiude il browser, la si riprende dalla schermata iniziale.
- **Editor di spicchi e domande**: si possono aggiungere o togliere spicchi (da 2 a 12),
  cambiarne nome, colore e icona, e scrivere o importare le domande.
- Timer, tema chiaro/scuro, schermo intero, esportazione dei risultati in PNG.

## Requisiti

- Windows 10 o 11
- [Node.js](https://nodejs.org) 18.18 o successivo (consigliato l'ultimo LTS).
  Va bene anche la versione portatile, senza installazione: vedi sotto.

## Avvio

1. Scarica il progetto (pulsante **Code → Download ZIP**) ed estrailo.
2. Fai doppio clic su **`Avvia Trivial.bat`**.
3. Il gioco si apre nel browser su `http://localhost:3000`. Per chiuderlo, chiudi la finestra nera.

Al **primo avvio** lo script scarica le dipendenze (cartella `frontend\node_modules`): serve internet
e qualche minuto. Dagli avvii successivi il gioco funziona senza connessione.

### Node.js portatile (senza installazione)

Utile su PC dove non si possono installare programmi, o per portare il gioco su una chiavetta USB:

1. Da [nodejs.org](https://nodejs.org) scarica **Windows Binary (.zip)**, versione x64.
2. Estrailo nella cartella del gioco, accanto a `Avvia Trivial.bat`
   (la cartella può chiamarsi `node` oppure mantenere il nome originale, es. `node-v26.13.0-win-x64`).

Lo script usa quel Node.js al posto di quello eventualmente installato.

Per giocare su un PC **senza internet**, avvia il gioco una volta su un PC connesso e poi copia tutta la
cartella, compresi `frontend\node_modules` e il Node.js portatile.

## Spicchi e domande personalizzati

Dal pulsante **"Spicchi e domande"** (o **Editor** durante la partita) si possono creare nuovi spicchi e
scrivere le domande: ogni domanda ha **una risposta corretta e tre sbagliate**.

Le domande si possono anche **importare da un file `.txt`** con righe numerate:

```
1) Qual è la capitale d'Italia? ROMA
2) Qual è la capitale d'Italia? ROMA | MILANO | NAPOLI | TORINO
```

La risposta è il testo dopo il punto interrogativo. Le risposte sbagliate si possono scrivere dopo la
corretta separate da `|`; se mancano, una procedura guidata le chiede subito dopo l'importazione.

Le modifiche vengono salvate in **`dati/spicchi.json`**, nella cartella del gioco: copiando la cartella
le domande vengono con lei. Dall'editor si può anche esportare e ricaricare un backup.

## Struttura del progetto

```
Avvia Trivial.bat           script di avvio
frontend/
  src/
    pages/TrivialGame.jsx   logica della partita
    components/             ruota, domande, editor, regole, giocatori
    data/questions.js       domande predefinite e regole di punteggio
  plugins/spicchi-file/     salvataggio di dati/spicchi.json
dati/                       creata al primo salvataggio (non inclusa nel repository)
```

Il gioco è un'app React (Create React App + CRACO, Tailwind CSS) eseguita dal server di sviluppo locale.
Comandi utili dalla cartella `frontend`: `yarn start` (avvio), `yarn build` (versione compilata).
