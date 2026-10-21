# maies

Design system di maies, l'app personale per ripassare l'inglese del corso: esercizi di traduzione, allenamento vocaboli, dizionario e schede di grammatica, su telefono e computer.

Il riferimento visivo sono le schermate confermate sulla canvas "maies UI" (https://claude.ai/artifact/VDTMJ6aAJBEhdUhAT2JxTQ): le due righe "Esercizi e vocaboli" e "Dizionario, grammatica e computer". Dove questo documento e le schermate non coincidono, valgono le schermate e questo documento va corretto.

## Voce

L'app parla a Sara in italiano, con il tu, in frasi brevi e semplici: "Com’era la tua risposta?", "Ancora nessuna frase da tradurre". I bottoni dicono l'azione: Conferma, Avanti, Giusta, Sbagliata. Niente punti esclamativi, niente emoji, niente incoraggiamenti. Gli stati vuoti dicono cosa succede e quando cambierà. Gli apostrofi e le virgolette nel testo dell'interfaccia sono tipografici (’ “ ”).

## Fondamenta visive

Un solo tema, scuro. L'atmosfera viene da due elementi.

- **Il bagliore.** Lo sfondo di ogni schermata è un gradiente radiale che scende dall'alto: `glow` al centro, `glow-mid` al 48%, `ground` dal 78% (radial-gradient 130% 55% at 50% 0%). Su computer è più largo e basso (90% 65%).
- **Le carte.** Il contenuto vive in carte con gradiente diagonale a 165° da `card-top` a `card-mid` (45%) a `card-end`, bordo di 1px `card-line`, angoli `radius-lg`. Negli esercizi e nei vocaboli una seconda carta `peek` spunta 9px sopra quella corrente, rientrata di 18px per lato: la sessione non finisce.

Il bottone principale è l'unico altro gradiente: orizzontale da `action-start` a `action-end`, con testo `on-action`.

## Colore

`accent` è il colore di ciò che è giusto e attivo: traduzione corretta, esito Giusta, voce attiva, campo con il fuoco. `wrong` compare solo sull'esito Sbagliata dei vocaboli e sempre con la croce e la parola, mai da solo. Il testo ha una scala di chiari dal più forte al più tenue: `ink-strong` per ciò che va tradotto, `ink` per l'interfaccia, `ink-answer` per la risposta di Sara, `ink-body` e `ink-soft` per i testi lunghi e le alternative, `ink-muted`, `lesson` e `label` per il contorno. Tutti hanno almeno 4,5:1 sul fondo e su ogni tappa del gradiente delle carte, tranne `label`, che arriva a 4,0:1 su `card-top`. Per questo le etichette `label` stanno solo dalla metà della carta in giù, dove il fondo è già `card-mid` o più scuro (6,1:1 e oltre). Sul bottone principale il testo è sempre `on-action`, mai bianco.

## Tipografia

Una sola famiglia, Poppins (Google Fonts, pesi 400, 500 e 600), con `system-ui` come ripiego. La frase o la parola da tradurre è lo stile più grande della schermata ed è centrata; tutto il resto è allineato a sinistra, tranne il titolo della schermata, che sul telefono è centrato. Su computer il titolo della schermata è allineato a sinistra, a 24px/32px. Gli stili sono in `tokens.json`.

## Forme e spazi

Carte con `radius-lg`, campi con `radius-md`, bottoni, ricerca e cerchi icona a pillola (`radius-pill`). La schermata da telefono ha margini laterali `space-5`, `space-top` in cima e `space-7` fra titolo, carta e bottone; il bottone principale sta in fondo, sopra la barra. Dentro le carte i blocchi sono separati da `space-card`. Ogni area toccabile è alta almeno 44px: i bottoni 56px (52px su computer), le voci della barra 56px.

## Componenti

Sono descritti qui e disegnati sulla canvas; non c'è ancora un pacchetto di componenti.

- **Bottone principale:** pillola alta 56px, gradiente d'azione, testo `button` in `on-action`. Uno solo per schermata: Conferma, Avanti o Giusta.
- **Bottone secondario:** pillola alta 56px, fondo `secondary`, bordo `secondary-line`, testo `ink` a peso 500. Sta a sinistra del principale.
- **Campo di testo:** alto 56px, fondo `field`, bordo di 1,5px `accent` quando ha il fuoco, segnaposto `placeholder`, etichetta `label` sopra. Niente correzione automatica né maiuscole automatiche.
- **Ricerca:** pillola alta 52px su `chip` con la lente `label` a sinistra; bordo `field-line` a riposo e `accent` mentre si scrive.
- **Esito dei vocaboli:** cerchio di 32px con spunta (`accent`) o croce (`wrong`) e la parola Giusta o Sbagliata accanto, in cima alla carta.
- **Barra di navigazione:** sul telefono quattro voci fisse in basso su `nav`, icona e nome; la voce attiva è `accent` con una pillola `accent-soft` dietro l'icona. Su computer le stesse voci in una pillola `nav-pill` in alto a destra, accanto al nome "maies".
- **Cerchio icona:** 40-44px, fondo `chip`, bordo `field-line`, per tornare indietro o aprire una lezione.

## Icone

Tratto lineare su griglia di 24px, spessore 1,8px, estremità e giunzioni arrotondate, colore ereditato dal testo (`currentColor`). Esercizi è una matita, Vocaboli due carte, Dizionario un libro, Grammatica tre righe. Sono SVG in linea e non ci sono file di icone.

## Logo

Non c'è un logo: il nome è "maies" in minuscolo, Poppins 600.
