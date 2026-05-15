/**
 * Tribal-land lookup tables for the homepage live-study map.
 *
 * Two structures live here:
 *
 *   - TRIBAL_SCENE_KEYS: short slug → candidate AIANNH names. The Hero
 *     resolves each candidate against the Census TIGER/Line AIANNH
 *     feature list (case-insensitive includes match) and picks the
 *     first hit. Multiple candidates per slug handle naming variation
 *     ('Cherokee Nation' vs. 'Cherokee').
 *
 *   - MANUAL_TRIBES: hand-anchored centroids for tribes whose lands
 *     are NOT in Census TIGER/Line 2018 AIANNH (newly recognized,
 *     newly placed-into-trust, or otherwise absent). Coordinates are
 *     in the same d3 albers-equal-area projection us-atlas uses, so
 *     they drop straight onto the homepage map's viewBox without a
 *     separate projection pass.
 */

export type ManualTribe = {
  name: string;
  cx: number;
  cy: number;
  /** 2-digit state FIPS the tribe sits in. */
  fips: string;
};

export const TRIBAL_SCENE_KEYS: Record<string, string[]> = {
  navajo:           ['Navajo Nation'],
  mille_lacs:       ['Mille Lacs'],
  umatilla:         ['Umatilla'],
  cherokee_ok:      ['Cherokee Nation', 'Cherokee'],
  yakama:           ['Yakama'],
  standing_rock:    ['Standing Rock'],
  pine_ridge:       ['Pine Ridge', 'Oglala'],
  eastern_cherokee: ['Eastern Band', 'Cherokee Indian Reservation'],
  hopi:             ['Hopi'],
  tohono:           ["Tohono O'odham", 'Tohono'],
  fort_peck:        ['Fort Peck'],
  oneida_ny:        ['Oneida'],
  // Wealthy / well-known gaming + enterprise tribes
  suquamish:        ['Port Madison'],
  pechanga:         ['Pechanga'],
  seminole_fl:      ['Big Cypress'],
  shakopee:         ['Shakopee'],
  seneca_ny:        ['Cattaraugus'],
  winnebago_ne:     ['Winnebago'],
  mashantucket:     ['Mashantucket'],
  morongo:          ['Morongo'],
  agua_caliente:    ['Agua Caliente'],
  muckleshoot:      ['Muckleshoot'],
  tulalip:          ['Tulalip Reservation'],
  ms_choctaw:       ['Mississippi Choctaw'],
  // Newly recognized + large enterprise nations
  lumbee:           ['Lumbee'],
  poarch:           ['Poarch'],
  southern_ute:     ['Southern Ute'],
  colorado_river:   ['Colorado River'],
  mashpee:          ['Mashpee'],
  flathead:         ['Flathead'],
  ho_chunk_wi:      ['Ho-Chunk'],
  chickasaw:        ['Chickasaw'],
  choctaw_ok:       ['Choctaw OTSA'],
  grand_ronde:      ['Grand Ronde Community', 'Grand Ronde'],
  mha:              ['Fort Berthold'],
  forest_potawatomi:['Forest County Potawatomi'],
  // California (~12)
  pala:             ['Pala Reservation', 'Pala'],
  rincon:           ['Rincon Reservation', 'Rincon'],
  sycuan:           ['Sycuan'],
  viejas:           ['Viejas'],
  soboba:           ['Soboba'],
  tule_river:       ['Tule River'],
  hoopa:            ['Hoopa Valley'],
  yurok:            ['Yurok'],
  cabazon:          ['Cabazon'],
  san_pasqual:      ['San Pasqual'],
  bishop_paiute:    ['Bishop Reservation', 'Bishop'],
  chemehuevi:       ['Chemehuevi'],
  // Arizona (~10)
  gila_river:       ['Gila River'],
  salt_river:       ['Salt River'],
  ak_chin:          ['Maricopa (Ak Chin)', 'Ak Chin', 'Ak-Chin'],
  pascua_yaqui:     ['Pascua Pueblo Yaqui', 'Pascua Yaqui'],
  hualapai:         ['Hualapai'],
  havasupai:        ['Havasupai'],
  san_carlos:       ['San Carlos'],
  white_mountain_apache: ['Fort Apache'],
  fort_mcdowell:    ['Fort McDowell'],
  yavapai_prescott: ['Yavapai-Prescott'],
  // New Mexico Pueblos + Apaches
  acoma:            ['Acoma Pueblo', 'Acoma'],
  isleta:           ['Isleta Pueblo', 'Isleta'],
  sandia:           ['Sandia Pueblo', 'Sandia'],
  santa_ana:        ['Santa Ana Pueblo', 'Santa Ana'],
  pojoaque:         ['Pojoaque Pueblo', 'Pojoaque'],
  san_felipe:       ['San Felipe Pueblo', 'San Felipe'],
  taos:             ['Taos Pueblo', 'Taos'],
  zuni:             ['Zuni'],
  mescalero:        ['Mescalero'],
  jicarilla:        ['Jicarilla Apache'],
  laguna:           ['Laguna Pueblo', 'Laguna'],
  ohkay_owingeh:    ['Ohkay Owingeh'],
  cochiti:          ['Cochiti'],
  // Nevada
  pyramid_lake:     ['Pyramid Lake'],
  moapa:            ['Moapa River', 'Moapa'],
  las_vegas_paiute: ['Las Vegas'],
  walker_river:     ['Walker River'],
  reno_sparks:      ['Reno-Sparks'],
  fallon:           ['Fallon Paiute-Shoshone'],
  duck_valley:      ['Duck Valley'],
  // Washington (more)
  lummi:            ['Lummi'],
  quinault:         ['Quinault'],
  makah:            ['Makah'],
  puyallup:         ['Puyallup'],
  squaxin:          ['Squaxin Island', 'Squaxin'],
  swinomish:        ['Swinomish'],
  kalispel:         ['Kalispel'],
  colville:         ['Colville'],
  spokane:          ['Spokane Reservation', 'Spokane'],
  nisqually:        ['Nisqually'],
  port_gamble:      ['Port Gamble'],
  chehalis:         ['Chehalis'],
  // Oregon
  warm_springs:     ['Warm Springs'],
  klamath_tribes:   ['Klamath'],
  coquille:         ['Coquille'],
  cow_creek:        ['Cow Creek'],
  siletz:           ['Siletz'],
  // Minnesota
  white_earth:      ['White Earth'],
  leech_lake:       ['Leech Lake'],
  bois_forte:       ['Bois Forte'],
  grand_portage:    ['Grand Portage'],
  fond_du_lac:      ['Fond du Lac'],
  red_lake:         ['Red Lake'],
  prairie_island:   ['Prairie Island'],
  lower_sioux:      ['Lower Sioux'],
  // Wisconsin
  menominee:        ['Menominee'],
  lac_du_flambeau:  ['Lac du Flambeau'],
  lac_courte_oreilles:['Lac Courte Oreilles'],
  bad_river:        ['Bad River'],
  red_cliff:        ['Red Cliff'],
  st_croix:         ['St. Croix'],
  stockbridge_munsee:['Stockbridge Munsee'],
  // Michigan
  saginaw_chippewa: ['Isabella'],
  sault_tribe:      ['Sault Ste. Marie'],
  bay_mills:        ['Bay Mills'],
  little_traverse:  ['Little Traverse'],
  hannahville:      ['Hannahville'],
  // New York Haudenosaunee
  st_regis_mohawk:  ['St. Regis Mohawk'],
  cayuga_ny:        ['Cayuga Nation'],
  onondaga:         ['Onondaga Nation'],
  tonawanda:        ['Tonawanda'],
  // Maine Wabanaki
  penobscot:        ['Penobscot'],
  passamaquoddy:    ['Passamaquoddy', 'Pleasant Point', 'Indian Township'],
  aroostook_micmac: ['Aroostook Band of Micmac'],
  // Montana
  crow:             ['Crow Reservation', 'Crow'],
  blackfeet:        ['Blackfeet'],
  northern_cheyenne:['Northern Cheyenne'],
  rocky_boys:       ["Rocky Boy"],
  fort_belknap:     ['Fort Belknap'],
  // South Dakota Oceti Sakowin
  rosebud:          ['Rosebud'],
  cheyenne_river:   ['Cheyenne River'],
  lower_brule:      ['Lower Brule'],
  yankton_sioux:    ['Yankton'],
  sisseton_wahpeton:['Lake Traverse'],
  // North Dakota
  turtle_mountain:  ['Turtle Mountain'],
  spirit_lake:      ['Spirit Lake'],
  // Oklahoma
  osage:            ['Osage'],
  muscogee:         ['Creek OTSA', 'Creek/Seminole'],
  citizen_potawatomi:['Citizen Potawatomi'],
  quapaw:           ['Quapaw OTSA', 'Quapaw'],
  comanche:         ['Kiowa-Comanche-Apache', 'Comanche'],
  kiowa:            ['Kiowa-Comanche-Apache'],
  otoe_missouria:   ['Otoe-Missouria', 'Otoe'],
  kaw:              ['Kaw OTSA', 'Kaw'],
  absentee_shawnee: ['Citizen Potawatomi Nation-Absentee Shawnee', 'Absentee'],
  cheyenne_arapaho: ['Cheyenne-Arapaho', 'Cheyenne and Arapaho'],
  // Idaho
  coeur_dalene:     ["Coeur d'Alene"],
  nez_perce:        ['Nez Perce'],
  fort_hall:        ['Fort Hall'],
  // WY + CO + UT
  wind_river:       ['Wind River'],
  uintah_ouray:     ['Uintah and Ouray'],
  // NE + KS + IA
  omaha:            ['Omaha Reservation', 'Omaha'],
  santee_ne:        ['Santee Reservation', 'Santee'],
  ponca_ne:         ['Ponca (NE)'],
  prairie_potawatomi:['Prairie Band of Potawatomi'],
  iowa_kansas:      ['Iowa (KS-NE)'],
  kickapoo_ks:      ['Kickapoo (KS)'],
  meskwaki:         ['Sac and Fox/Meskwaki'],
  // LA / TX / MS / AL
  coushatta_la:     ['Coushatta'],
  chitimacha:       ['Chitimacha'],
  jena_choctaw:     ['Jena Band of Choctaw'],
  ysleta_del_sur:   ['Ysleta del Sur'],
  alabama_coushatta:['Alabama-Coushatta'],
  // New England + FL
  aquinnah:         ['Wampanoag-Aquinnah', 'Aquinnah'],
  narragansett:     ['Narragansett'],
  miccosukee:       ['Miccosukee'],
};

export const MANUAL_TRIBES: Record<string, ManualTribe> = {
  // Kings Mountain, NC (Two Kings Casino — Catawba Nation's trust land).
  // Projected via d3.geoAlbersUsa().scale(1300).translate([487.5,305]).
  catawba:    { name: 'Catawba Nation',           cx: 766.2, cy: 363.3, fips: '37' },
  // Uncasville, CT (Mohegan Sun).
  mohegan:    { name: 'Mohegan Tribe',            cx: 896.7, cy: 192.2, fips: '09' },
  // Longview, WA (Cowlitz tribal homeland + headquarters area).
  cowlitz:    { name: 'Cowlitz Tribe',            cx:  79.4, cy:  75.5, fips: '53' },
  // Hollywood, FL (Seminole Hard Rock Guitar Hotel — Hollywood Reservation).
  // Separate from the Big Cypress Reservation centroid in Census data.
  seminole_hw:{ name: 'Seminole Tribe (Hollywood)',cx: 822.6, cy: 566.9, fips: '12' },
  // Lincoln, NE (WarHorse Casino — Ho-Chunk Inc. subsidiary, Winnebago Tribe NE).
  warhorse:   { name: 'WarHorse Gaming (Ho-Chunk Inc.)', cx: 459, cy: 358, fips: '31' },
  // Utqiagvik / Barrow, AK (ASRC HQ — Arctic Slope Regional Corporation).
  // Anchored to the Barrow ANVSA centroid in the Census dataset.
  asrc:       { name: 'Arctic Slope Regional Corporation', cx: 89.3, cy: 465.3, fips: '02' },
  // Kotzebue, AK (NANA Regional Corporation HQ).
  nana:       { name: 'NANA Regional Corporation', cx: 70.1, cy: 498.1, fips: '02' },
  // Kodiak Island, AK. Afognak Native Corp.'s shareholders relocated
  // from Afognak Island to Port Lions on Kodiak after the 1964 quake.
  // Anchored at the Kodiak ANVSA centroid.
  afognak:    { name: 'Afognak Native Corporation', cx: 102.7, cy: 571.5, fips: '02' },

  // Michigan + Indiana gaming tribes (Four Winds, Gun Lake, FireKeepers).
  pokagon:        { name: 'Pokagon Band of Potawatomi',                cx: 653.3, cy: 226.7, fips: '26' },
  gun_lake:       { name: 'Match-E-Be-Nash-She-Wish Band (Gun Lake)',  cx: 669.8, cy: 205.3, fips: '26' },
  firekeepers:    { name: 'Nottawaseppi Huron Band (FireKeepers)',     cx: 677.9, cy: 211.9, fips: '26' },
  // Pacific Northwest tribes.
  snoqualmie:     { name: 'Snoqualmie Indian Tribe',                   cx: 104.2, cy:  49.9, fips: '53' },
  jamestown:      { name: 'Jamestown S’Klallam Tribe',             cx:  89.3, cy:  32.8, fips: '53' },
  quileute:       { name: 'Quileute Tribe',                            cx:  65.6, cy:  29.6, fips: '53' },
  lower_elwha:    { name: 'Lower Elwha Klallam Tribe',                 cx:  83.0, cy:  29.8, fips: '53' },
  // Arizona / California gaming tribes.
  yavapai_apache: { name: 'Yavapai-Apache Nation',                     cx: 205.6, cy: 375.4, fips: '04' },
  tachi_yokut:    { name: 'Tachi-Yokut (Santa Rosa Rancheria)',        cx:  71.7, cy: 306.4, fips: '06' },
  chukchansi:     { name: 'Picayune Rancheria of Chukchansi Indians',  cx:  78.6, cy: 285.5, fips: '06' },
  twentynine:     { name: 'Twenty-Nine Palms Band of Mission Indians', cx: 122.7, cy: 380.0, fips: '06' },
  karuk:          { name: 'Karuk Tribe',                               cx:  44.6, cy: 168.5, fips: '06' },
  wiyot:          { name: 'Wiyot Tribe',                               cx:  25.0, cy: 186.5, fips: '06' },
  burns_paiute:   { name: 'Burns Paiute Tribe',                        cx: 124.4, cy: 147.7, fips: '41' },
  // Pamunkey, VA — newly federally recognized in 2015.
  pamunkey:       { name: 'Pamunkey Indian Tribe',                     cx: 835.0, cy: 298.7, fips: '51' },
  // Alaska Native Regional Corporations (ANCSA).
  sealaska:       { name: 'Sealaska Corporation',                      cx: 176.9, cy: 556.1, fips: '02' },
  ciri:           { name: 'Cook Inlet Region Inc. (CIRI)',             cx: 112.3, cy: 544.3, fips: '02' },
  doyon:          { name: 'Doyon, Limited',                            cx: 117.8, cy: 514.9, fips: '02' },
  bristol_bay:    { name: 'Bristol Bay Native Corporation',            cx:  86.2, cy: 570.2, fips: '02' },
  calista:        { name: 'Calista Corporation',                       cx:  69.5, cy: 549.0, fips: '02' },
  ahtna:          { name: 'Ahtna Incorporated',                        cx: 128.1, cy: 535.7, fips: '02' },
  chugach:        { name: 'Chugach Alaska Corporation',                cx: 117.9, cy: 544.6, fips: '02' },

  // Native Hawaiian Organizations (NHOs). Anchored at Honolulu, Oahu.
  nakupuna:           { name: 'Nakupuna Companies',  cx: 266.9, cy: 549.1, fips: '15' },
  kamehameha_schools: { name: 'Kamehameha Schools',  cx: 266.9, cy: 549.1, fips: '15' },
};
