// Il sito si compila in due edizioni dallo stesso codice: la principale e quella
// per i kids (modalità di Vite `kids`, servita sotto /kids/).
export type Edizione = 'principale' | 'kids'

export const EDIZIONE: Edizione = import.meta.env.MODE === 'kids' ? 'kids' : 'principale'

// Le due edizioni stanno sullo stesso dominio e i loro id si sovrappongono:
// ognuna ha la sua chiave in localStorage.
export function chiaveProgressi(edizione: Edizione): string {
  return edizione === 'kids' ? 'maies.kids.progressi' : 'maies.progressi'
}
