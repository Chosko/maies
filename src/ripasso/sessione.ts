import { catalogo as catalogoApp } from '../contenuti/catalogo'
import type { Catalogo, FraseCatalogo, VocaboloCatalogo } from '../contenuti/catalogo'
import { creaArchivio } from './archivio'
import type { ArchivioProgressi } from './archivio'
import { isImportanza } from './importanza'
import type { Importanza } from './importanza'
import { nuovoLivello } from './livelli'
import type { Esito } from './livelli'
import { scegli } from './selettore'
import type { Casualita } from './selettore'

interface ElementiPerTipo {
  frasi: FraseCatalogo
  vocaboli: VocaboloCatalogo
}

export type TipoSessione = keyof ElementiPerTipo

export interface OpzioniSessione {
  catalogo?: Catalogo
  archivio?: ArchivioProgressi
  casualita?: Casualita
}

export type Proposta<E> =
  | { readonly caso: 'elemento'; readonly elemento: E; readonly importanza: Importanza }
  | { readonly caso: 'nessun-materiale' }
  | { readonly caso: 'tutti-tolti' }

export interface SessioneRipasso<E> {
  prossimoElemento(): Proposta<E>
  registraEsito(idGlobale: string, esito: Esito): void
  registraImportanza(idGlobale: string, importanza: Importanza): void
}

const FINESTRA = 3

let archivioApp: ArchivioProgressi | undefined

// Un solo archivio per la pagina, creato al primo uso: tutte le sessioni dell'app vedono gli stessi progressi.
function archivioPredefinito(): ArchivioProgressi {
  archivioApp ??= creaArchivio()
  return archivioApp
}

export function creaSessione<T extends TipoSessione>(
  tipo: T,
  opzioni: OpzioniSessione = {},
): SessioneRipasso<ElementiPerTipo[T]> {
  const catalogo = opzioni.catalogo ?? catalogoApp
  const archivio = opzioni.archivio ?? archivioPredefinito()
  const casualita = opzioni.casualita ?? Math.random
  const elementi = (tipo === 'frasi' ? catalogo.frasi : catalogo.vocaboli) as readonly ElementiPerTipo[T][]
  const perId = new Map(elementi.map((elemento) => [elemento.idGlobale, elemento]))
  const ultimi: string[] = []

  return {
    prossimoElemento() {
      if (elementi.length === 0) return { caso: 'nessun-materiale' }
      const candidati = elementi.map((elemento) => ({
        id: elemento.idGlobale,
        livello: archivio.leggiLivello(elemento.idGlobale),
        importanza: archivio.leggiImportanza(elemento.idGlobale),
        elemento,
      }))
      // La finestra si calcola a ogni richiesta: i candidati diminuiscono quando un elemento viene tolto.
      const rimasti = candidati.filter((candidato) => candidato.importanza !== 0).length
      const ampiezza = Math.min(FINESTRA, Math.max(rimasti - 1, 0))
      const scelto = scegli(candidati, ultimi.slice(Math.max(ultimi.length - ampiezza, 0)), casualita)
      if (scelto === null) return { caso: 'tutti-tolti' }
      ultimi.push(scelto.id)
      if (ultimi.length > FINESTRA) ultimi.splice(0, ultimi.length - FINESTRA)
      return { caso: 'elemento', elemento: scelto.elemento, importanza: scelto.importanza }
    },
    registraEsito(idGlobale, esito) {
      if (!perId.has(idGlobale)) return
      archivio.salvaLivello(idGlobale, nuovoLivello(archivio.leggiLivello(idGlobale), esito))
    },
    registraImportanza(idGlobale, importanza) {
      if (!perId.has(idGlobale) || !isImportanza(importanza)) return
      archivio.salvaImportanza(idGlobale, importanza)
    },
  }
}
