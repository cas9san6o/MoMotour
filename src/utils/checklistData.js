export const tipiViaggio = [
  { id: 'roadtrip', label: '🚗 Road Trip' },
  { id: 'mare', label: '🏖️ Mare' },
  { id: 'montagna', label: '🏔️ Montagna' },
  { id: 'citybreak', label: '🌆 City Break' },
  { id: 'natura', label: '🌿 Natura/Trekking' },
  { id: 'volo', label: '✈️ Volo Lungo' },
  { id: 'campeggio', label: '🏕️ Campeggio' },
  { id: 'zaino', label: '🎒 Zaino in Spalla' }
];

export const categorieSedi = [
  { id: 'documenti', label: 'Documenti', icon: '📄', color: 'bg-blue-100 text-blue-700' },
  { id: 'abbigliamento', label: 'Abbigliamento', icon: '🧳', color: 'bg-purple-100 text-purple-700' },
  { id: 'igiene', label: 'Igiene', icon: '🧴', color: 'bg-teal-100 text-teal-700' },
  { id: 'auto', label: 'Auto', icon: '🚗', color: 'bg-gray-100 text-gray-700' },
  { id: 'tech', label: 'Tech', icon: '📱', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'salute', label: 'Salute', icon: '💊', color: 'bg-red-100 text-red-700' },
  { id: 'attrezzatura', label: 'Attrezzatura', icon: '⛺', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'varie', label: 'Varie', icon: '🎒', color: 'bg-orange-100 text-orange-700' }
];

// Helper per creare gli item rapidamente
const createItem = (testo, categoria) => ({
  id: crypto.randomUUID(),
  testo,
  categoria,
  checked: false
});

const defaultDocumenti = [
  'Carta d\'Identità/Passaporto', 'Carta di credito/Debito', 'Contanti',
  'Tessera sanitaria', 'Biglietti/Prenotazioni (stampati o app)'
];

const defaultIgiene = [
  'Spazzolino', 'Dentifricio', 'Shampoo e Bagnoschiuma', 'Deodorante',
  'Pettine/Spazzola', 'Crema solare'
];

const defaultTech = [
  'Telefono', 'Caricabatterie', 'Power bank', 'Cuffie'
];

const defaultSalute = [
  'Antidolorifici', 'Cerotti', 'Farmaci personali'
];

export function getPrenotazioniForType(type) {
  let items = [];

  const add = (lista, categoria) => {
    lista.forEach(t => items.push(createItem(t, categoria)));
  };

  // Base items per quasi tutti
  add(defaultDocumenti, 'documenti');
  add(defaultIgiene, 'igiene');
  add(defaultTech, 'tech');
  add(defaultSalute, 'salute');

  switch (type) {
    case 'roadtrip':
      add(['Patente', 'Carta verde assicurazione', 'Libretto veicolo', 'Numero emergenza assicurazione'], 'documenti');
      add(['Triangolo emergenza', 'Giubbotto catarifrangente', 'Kit pronto soccorso', 'Caricatore USB auto', 'Supporto telefono', 'Bottiglia d\'acqua'], 'auto');
      add(['T-shirt comode', 'Pantaloni/Jeans', 'Felpa', 'Scarpe comode', 'Occhiali da sole', 'Snack da viaggio'], 'varie');
      break;
    case 'mare':
      add(['Costume da bagno', 'Telo mare', 'Infradito/Sandali', 'Occhiali da sole', 'Copricostume', 'Cappello'], 'abbigliamento');
      add(['Doposole', 'Borsa termica', 'Borsa da spiaggia'], 'varie');
      break;
    case 'montagna':
      add(['Scarponi da trekking', 'Calzettoni tecnici', 'Giacca antivento/antipioggia', 'Pile caldo', 'Pantaloni lunghi', 'Zaino comodo'], 'abbigliamento');
      add(['Borraccia', 'Bastoncini da trekking', 'Mappa sentieri', 'Torcia/Frontale'], 'attrezzatura');
      break;
    case 'citybreak':
      add(['Scarpe molto comode per camminare', 'Giacca leggera', 'Ombrello compatto', 'Zainetto o borsa tracolla sicura'], 'abbigliamento');
      add(['Guida città/App offline'], 'varie');
      break;
    case 'campeggio':
      add(['Tenda', 'Sacco a pelo', 'Materassino', 'Fornelletto', 'Gavetta/Posate', 'Torcia da testa', 'Coltellino multiuso', 'Accendino/Fiammiferi'], 'attrezzatura');
      add(['Repellente insetti', 'Carta igienica'], 'igiene');
      add(['Cibo a lunga conservazione', 'Sacchetti spazzatura'], 'varie');
      break;
    case 'volo':
      add(['Passaporto valevole', 'Visto (se necessario)'], 'documenti');
      add(['Cuscino da viaggio', 'Mascherina occhi', 'Tappi per orecchie', 'Calze a compressione', 'Maglione/Felpa (per aria condizionata)'], 'varie');
      add(['Adattatore universale prese'], 'tech');
      break;
    case 'natura':
      add(['Scarpe da trekking o trail', 'Borraccia d\'acqua abbondante', 'Bussola/GPS', 'Protezione pioggia / K-way'], 'attrezzatura');
      add(['Repellente insetti', 'Kit morso zecca'], 'igiene');
      break;
    case 'zaino':
      add(['Zaino da 40L-60L', 'Coprizaino impermeabile', 'Asciugamano in microfibra', 'Lucchetto', 'Organizer valigia (Packing cubes)'], 'attrezzatura');
      add(['Detersivo bucato monouso'], 'igiene');
      break;
    default:
      // Abbigliamento base se non specifico
      add(['T-shirt x giorni', 'Pantaloni', 'Felpa', 'Scarpe', 'Biancheria intima x giorni', 'Calze x giorni'], 'abbigliamento');
      break;
  }

  // Aggiungi gli id univoci freschi ogni volta ricalcoliamo
  return items.map(item => ({ ...item, id: crypto.randomUUID() }));
}

export function getSpecificItemsForType(type) {
  let items = [];

  const add = (lista, categoria) => {
    lista.forEach(t => items.push({ testo: t, categoria }));
  };

  switch (type) {
    case 'roadtrip':
      add(['Patente', 'Carta verde assicurazione', 'Libretto veicolo', 'Numero emergenza assicurazione'], 'documenti');
      add(['Triangolo emergenza', 'Giubbotto catarifrangente', 'Kit pronto soccorso', 'Caricatore USB auto', 'Supporto telefono', 'Bottiglia d\'acqua'], 'auto');
      add(['T-shirt comode', 'Pantaloni/Jeans', 'Felpa', 'Scarpe comode', 'Occhiali da sole', 'Snack da viaggio'], 'varie');
      break;
    case 'mare':
      add(['Costume da bagno', 'Telo mare', 'Infradito/Sandali', 'Occhiali da sole', 'Copricostume', 'Cappello'], 'abbigliamento');
      add(['Doposole', 'Borsa termica', 'Borsa da spiaggia'], 'varie');
      break;
    case 'montagna':
      add(['Scarponi da trekking', 'Calzettoni tecnici', 'Giacca antivento/antipioggia', 'Pile caldo', 'Pantaloni lunghi', 'Zaino comodo'], 'abbigliamento');
      add(['Borraccia', 'Bastoncini da trekking', 'Mappa sentieri', 'Torcia/Frontale'], 'attrezzatura');
      break;
    case 'citybreak':
      add(['Scarpe molto comode per camminare', 'Giacca leggera', 'Ombrello compatto', 'Zainetto o borsa tracolla sicura'], 'abbigliamento');
      add(['Guida città/App offline'], 'varie');
      break;
    case 'campeggio':
      add(['Tenda', 'Sacco a pelo', 'Materassino', 'Fornelletto', 'Gavetta/Posate', 'Torcia da testa', 'Coltellino multiuso', 'Accendino/Fiammiferi'], 'attrezzatura');
      add(['Repellente insetti', 'Carta igienica'], 'igiene');
      add(['Cibo a lunga conservazione', 'Sacchetti spazzatura'], 'varie');
      break;
    case 'volo':
      add(['Passaporto valevole', 'Visto (se necessario)'], 'documenti');
      add(['Cuscino da viaggio', 'Mascherina occhi', 'Tappi per orecchie', 'Calze a compressione', 'Maglione/Felpa (per aria condizionata)'], 'varie');
      add(['Adattatore universale prese'], 'tech');
      break;
    case 'natura':
      add(['Scarpe da trekking o trail', 'Borraccia d\'acqua abbondante', 'Bussola/GPS', 'Protezione pioggia / K-way'], 'attrezzatura');
      add(['Repellente insetti', 'Kit morso zecca'], 'igiene');
      break;
    case 'zaino':
      add(['Zaino da 40L-60L', 'Coprizaino impermeabile', 'Asciugamano in microfibra', 'Lucchetto', 'Organizer valigia (Packing cubes)'], 'attrezzatura');
      add(['Detersivo bucato monouso'], 'igiene');
      break;
    default:
      add(['T-shirt x giorni', 'Pantaloni', 'Felpa', 'Scarpe', 'Biancheria intima x giorni', 'Calze x giorni'], 'abbigliamento');
      break;
  }

  return items;
}
