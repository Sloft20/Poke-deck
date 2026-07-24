const API_BASE = "https://api.tcgdex.net/v2";
const LANG = "pt"; // português (com fallback automático para inglês quando faltar tradução)
const ASSET_QUALITY = "low"; // "low" (245x337) ou "high" (600x825)
const ASSET_EXT = "webp";

const SEARCH_CACHE_KEY = "pokedeck:search-cache:v2";
const CARD_CACHE_KEY = "pokedeck:card-cache:v2";
const MAX_CACHED_SEARCHES = 40;
const MAX_CACHED_CARDS = 500;

function readCache(key) {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function writeCache(key, cache, max) {
  try {
    const entries = Object.entries(cache);
    const trimmed = entries.slice(-max);
    localStorage.setItem(key, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    // localStorage cheio ou indisponível — ignora silenciosamente
  }
}

/** Monta a URL final de uma imagem de carta do TCGdex */
export function cardImageUrl(image, quality = ASSET_QUALITY, ext = ASSET_EXT) {
  if (!image) return "";
  return `${image}/${quality}.${ext}`;
}

/**
 * Busca cartas por nome. Retorna objetos "brief" (id, nome, imagem) —
 * dados completos (categoria, estágio etc.) são buscados sob demanda.
 */
export const searchCards = async (filtros) => {
  try {
    let url = `${API_BASE}/${LANG}/cards`;
    let params = new URLSearchParams();

    // Se a busca vier como string simples
    if (typeof filtros === 'string') {
      params.append('name', filtros);
    } else {
      // Se vier do nosso painel de Filtros Avançados
      if (filtros.nome) params.append('name', filtros.nome);
      if (filtros.hp) params.append('hp', filtros.hp);

      if (filtros.subtipo) {
        const treinadores = ['Supporter', 'Item', 'Stadium', 'Pokémon Tool'];
        const estagios = ['Basic', 'Stage 1', 'Stage 2'];
        
        if (filtros.subtipo === 'ACE SPEC Rare') {
          // MÁGICA: Redireciona a busca para o campo de Raridade exclusivo do TCGDex
          params.append('rarity', 'ACE SPEC Rare');
        } else if (treinadores.includes(filtros.subtipo)) {
          params.append('category', 'Trainer');
          params.append('trainerType', filtros.subtipo);
        } else if (estagios.includes(filtros.subtipo)) {
          params.append('stage', filtros.subtipo);
        } else {
          // V, VMAX, EX ficam no "suffix" no TCGdex
          params.append('suffix', filtros.subtipo); 
        }
      }
    }

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erro na API TCGdex: ${response.status}`);
    
    // O TCGdex devolve uma array direto. Envolvemos em { data } 
    // para não quebrar o código do React que já estava pronto.
    const data = await response.json();
    return { data: data }; 
    
  } catch (error) {
    console.error("Erro na pokeApi (TCGDex):", error);
    return { data: [] };
  }
};

/**
 * Busca os dados completos de uma carta (categoria, estágio, tipo de
 * treinador/energia, raridade etc.) — necessário para validar as regras.
 * Resultado fica em cache local para funcionar offline depois.
 */
export async function getCardDetail(id) {
  const cache = readCache(CARD_CACHE_KEY);
  const cached = cache[id];

  try {
    const res = await fetch(`${API_BASE}/${LANG}/cards/${id}`);
    if (!res.ok) throw new Error(`Erro na API: ${res.status}`);
    const data = await res.json();
    cache[id] = { data, ts: Date.now() };
    writeCache(CARD_CACHE_KEY, cache, MAX_CACHED_CARDS);
    return data;
  } catch (err) {
    if (cached) return cached.data;
    throw err;
  }
}

/** Reduz uma carta completa para os campos necessários para deck/regras/offline */
export function slimCard(full) {
  return {
    id: full.id,
    name: full.name,
    image: full.image || "",
    category: full.category, // "Pokemon" | "Trainer" | "Energy"
    stage: full.stage || null, // "Basic" | "Stage1" | "Stage2" (só Pokémon)
    trainerType: full.trainerType || null, // "Item" | "Supporter" | "Stadium" | "Tool" | "Ace Spec" | ...
    energyType: full.energyType || null, // "Basic" | "Special"
    rarity: full.rarity || null,
    setName: full.set?.name || "",
    setId: full.set?.id || "",
    localId: full.localId || "",
  };
}
