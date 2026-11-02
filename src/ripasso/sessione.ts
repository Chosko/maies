import { catalogo as catalogoApp } from '../contenuti/catalogo'
import type { Catalogo, FraseCatalogo, LezioneCatalogo, VocaboloCatalogo } from '../contenuti/catalogo'
import { applicaEsito, giornoLocale } from './apprendimento'
import type { Esito, Giorno } from './apprendimento'
import { creaArchivio } from './archivio'
import type { ArchivioProgressi } from './archivio'
import { isImportanza } from './importanza'
import type { Importanza } from './importanza'
import { DIMENSIONE_GRUPPO, FINESTRA, TURNO_INIZIALE, pianifica } from './pianificatore'
import type { Candidato, Casualita, Turno } from './pianificatore'

interface ElementiPerTipo {
  frasi: FraseCatalogo
  vocaboli: VocaboloCatalogo
}

export type TipoSessione = keyof ElementiPerTipo

export interface OpzioniSessione {
  catalogo?: Catalogo
  archivio?: ArchivioProgressi
  casualita?: Casualita
  /** La data di oggi, chiesta a ogni scelta e a ogni esito. */
  oggi?: () => Giorno
}

export type Proposta<E> =
  | { readonly caso: 'elemento'; readonly elemento: E; readonly importanza: Importanza }
  | { readonly caso: 'nessun-materiale' }
  | { readonly caso: 'tutti-tolti' }

export type PropostaElemento<E> = Extract<Proposta<E>, { readonly caso: 'elemento' }>

export interface SessioneRipasso<E> {
  prossimoElemento(): Proposta<E>
  /** L'elemento indicato da fuori, contato fra gli ultimi proposti; `null` se sconosciuto, di un altro tipo o tolto. */
  elementoPerId(idGlobale: string): PropostaElemento<E> | null
  registraEsito(idGlobale: string, esito: Esito): void
  registraImportanza(idGlobale: string, importanza: Importanza): void
}

interface Collocato<E> {
  readonly elemento: E
  /** Posizione della lezione nel catalogo, ordinato per id: più alta è più recente. */
  readonly lezione: number
  readonly ordine: number
}

let archivioApp: ArchivioProgressi | undefined

// Un solo archivio per la pagina, creato al primo uso: tutte le sessioni dell'app vedono gli stessi progressi.
function archivioPredefinito(): ArchivioProgressi {
  archivioApp ??= creaArchivio()
  return archivioApp
}

function oggiLocale(): Giorno {
  return giornoLocale(new Date())
}

function elementiDellaLezione<T extends TipoSessione>(
  lezione: LezioneCatalogo,
  tipo: T,
): readonly ElementiPerTipo[T][] {
  return (tipo === 'frasi' ? lezione.sentences : lezione.vocabulary) as readonly ElementiPerTipo[T][]
}

export function creaSessione<T extends TipoSessione>(
  tipo: T,
  opzioni: OpzioniSessione = {},
): SessioneRipasso<ElementiPerTipo[T]> {
  const catalogo = opzioni.catalogo ?? catalogoApp
  const archivio = opzioni.archivio ?? archivioPredefinito()
  const casualita = opzioni.casualita ?? Math.random
  const oggi = opzioni.oggi ?? oggiLocale
  const collocati: Collocato<ElementiPerTipo[T]>[] = catalogo.lezioni.flatMap((lezione, numero) =>
    elementiDellaLezione(lezione, tipo).map((elemento, ordine) => ({ elemento, lezione: numero, ordine })),
  )
  const perId = new Map(collocati.map(({ elemento }) => [elemento.idGlobale, elemento]))
  const ultimi: string[] = []
  let turno: Turno = TURNO_INIZIALE

  function ricordaProposto(idGlobale: string): void {
    ultimi.push(idGlobale)
    if (ultimi.length > FINESTRA) ultimi.splice(0, ultimi.length - FINESTRA)
  }

  return {
    prossimoElemento() {
      if (collocati.length === 0) return { caso: 'nessun-materiale' }
      const candidati = collocati.map(
        ({ elemento, lezione, ordine }): Candidato & { readonly elemento: ElementiPerTipo[T] } => ({
          id: elemento.idGlobale,
          stato: archivio.leggiStato(elemento.idGlobale),
          importanza: archivio.leggiImportanza(elemento.idGlobale),
          lezione,
          ordine,
          elemento,
        }),
      )
      const pianificazione = pianifica(candidati, {
        dimensione: DIMENSIONE_GRUPPO[tipo],
        oggi: oggi(),
        ultimi,
        turno,
        casualita,
      })
      for (const entrato of pianificazione.entrati) archivio.salvaStato(entrato.id, { stato: 'nel-gruppo', serie: 0 })
      turno = pianificazione.turno
      if (pianificazione.scelta === null) return { caso: 'tutti-tolti' }
      const { candidato } = pianificazione.scelta
      ricordaProposto(candidato.id)
      return { caso: 'elemento', elemento: candidato.elemento, importanza: candidato.importanza }
    },
    elementoPerId(idGlobale) {
      const elemento = perId.get(idGlobale)
      if (elemento === undefined) return null
      const importanza = archivio.leggiImportanza(idGlobale)
      if (importanza === 0) return null
      ricordaProposto(idGlobale)
      return { caso: 'elemento', elemento, importanza }
    },
    registraEsito(idGlobale, esito) {
      if (!perId.has(idGlobale)) return
      const importanza = archivio.leggiImportanza(idGlobale)
      // Un elemento tolto non torna negli allenamenti: il suo esito non conta.
      if (importanza === 0) return
      archivio.salvaStato(idGlobale, applicaEsito(archivio.leggiStato(idGlobale), esito, importanza, oggi()))
    },
    registraImportanza(idGlobale, importanza) {
      if (!perId.has(idGlobale) || !isImportanza(importanza)) return
      archivio.salvaImportanza(idGlobale, importanza)
    },
  }
}
