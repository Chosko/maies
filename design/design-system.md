# maies

Design system di maies, l'app personale per ripassare l'inglese del corso: esercizi di traduzione, allenamento vocaboli, dizionario e schede di grammatica, su telefono e computer.

Il riferimento visivo sono le schermate confermate sulla canvas "maies UI" (https://claude.ai/artifact/VDTMJ6aAJBEhdUhAT2JxTQ): le due righe "Esercizi e vocaboli" e "Dizionario, grammatica e computer". Dove questo documento e le schermate non coincidono, valgono le schermate e questo documento va corretto.

## Voce

L'app parla a Sara in italiano, con il tu, in frasi brevi e semplici: "Com’era la tua risposta?", "Ancora nessuna frase da tradurre". I bottoni dicono l'azione: Conferma, Avanti, Giusta, Sbagliata. Niente punti esclamativi, niente emoji, niente incoraggiamenti. Gli stati vuoti dicono cosa succede e quando cambierà. Gli apostrofi e le virgolette nel testo dell'interfaccia sono tipografici (’ “ ”).

## Fondamenta visive

Un solo tema, scuro. L'atmosfera viene da tre elementi.

- **Il bagliore.** Lo sfondo di ogni schermata è un gradiente radiale blu notte che scende dall'alto: `glow` al centro, `glow-mid` al 48%, `ground` dal 78% (radial-gradient 130% 55% at 50% 0%). Su computer è più largo e basso (90% 65%).
- **Le carte.** Il contenuto vive in carte con gradiente diagonale a 165° da `card-top` a `card-mid` (45%) a `card-end`, bordo di 1px `card-line`, angoli `radius-lg`. Le carte di elenco (grammatica, dizionario) usano un gradiente più quieto che parte da `card-list-top`. Negli esercizi e nei vocaboli una seconda carta `peek` spunta 9px sopra quella corrente, rientrata di 18px per lato: la sessione non finisce. La carta dell'esito Sbagliata vira al rosso: gradiente da `wrong-top` a `wrong-mid` a `wrong-end`, bordo `wrong-line`, etichette `wrong-label` e `wrong-lesson`; la traduzione corretta resta in `accent`.
- **La bandiera a punti.** In basso a destra di ogni schermata si intravede un frammento della Union Jack fatto di puntini, come una retinatura: `flag-red` sulla croce (opacità 0,6), `flag-white` sulle diagonali (0,4), `flag-blue` sul fondo (0,35). È solo un accenno: si vedono l'incrocio della croce e un pezzo di diagonale che escono dal bordo destro. I puntini sono su una griglia di 8px, al massimo 2,2px di raggio al centro del frammento, e rimpiccioliscono fino a sparire verso il centro dello schermo. Su computer il frammento sta nell'angolo in basso a destra della pagina. Le carte e la barra di navigazione stanno sopra.

Il bottone principale è l'unico altro gradiente: una pillola bianca che sfuma appena verso l'azzurro, da `action-start` a `action-end`, con testo `on-action`.

## Colore

I colori sono quelli della bandiera, ognuno con un significato. Il blu è l'app e ciò che è giusto: fondo, carte e `accent`, l'azzurro della traduzione corretta, dell'esito Giusta, della voce attiva e del campo con il fuoco. Il rosso è solo l'errore: la carta dell'esito Sbagliata e `wrong`, che compare sempre con la croce e la parola, mai da solo. Il bianco è l'azione: il bottone principale. Fuori da questi usi il rosso compare solo nei puntini della bandiera.

Il testo ha una scala di chiari dal più forte al più tenue: `ink-strong` per ciò che va tradotto, `ink` per l'interfaccia, `ink-answer` per la risposta di Sara, `ink-body` e `ink-soft` per i testi lunghi e le alternative, `ink-muted`, `lesson` e `label` per il contorno. Tutti hanno almeno 6:1 sul fondo e su ogni tappa del gradiente delle carte; sulla carta d'errore `wrong-label` e `wrong-lesson` arrivano ad almeno 6,5:1. Il testo segnaposto `placeholder` è il più tenue, 4,7:1 su `chip`.

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

Il logo è l'icona dell'app: la Union Jack fatta di puntini, centrata su un quadrato con il gradiente delle carte (`card-top`, `card-mid`, `card-end`), che sfuma in tutte le direzioni verso il blu. Usa gli stessi colori dei puntini dello sfondo: croce `flag-red`, diagonali `flag-white`, fondo `flag-blue`. I file sono nel gruppo Logos: `maies-icona.svg` è il sorgente vettoriale, `maies-icona-512.png` la versione 512 × 512. L'icona è quadrata e senza angoli arrotondati, perché li arrotonda il telefono. Accanto all'icona o nella barra in alto su computer il nome resta "maies" in minuscolo, Poppins 600; non esiste un logotipo diverso.
