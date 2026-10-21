import { catalogo as catalogoApp } from '../contenuti/catalogo'
import type { Catalogo, FraseCatalogo, VocaboloCatalogo } from '../contenuti/catalogo'
import { creaArchivio } from './archivio'
import type { ArchivioProgressi } from './archivio'
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

export interface SessioneRipasso<E> {
  prossimoElemento(): E | null
  registraEsito(idGlobale: string, esito: Esito): void
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
  const ampiezza = Math.min(FINESTRA, Math.max(elementi.length - 1, 0))
  const ultimi: string[] = []

  return {
    prossimoElemento() {
      const candidati = elementi.map((elemento) => ({
        id: elemento.idGlobale,
        livello: archivio.leggiLivello(elemento.idGlobale),
        elemento,
      }))
      const scelto = scegli(candidati, ultimi, casualita)
      if (scelto === null) return null
      ultimi.push(scelto.id)
      if (ultimi.length > ampiezza) ultimi.splice(0, ultimi.length - ampiezza)
      return scelto.elemento
    },
    registraEsito(idGlobale, esito) {
      if (!perId.has(idGlobale)) return
      archivio.salvaLivello(idGlobale, nuovoLivello(archivio.leggiLivello(idGlobale), esito))
    },
  }
}
