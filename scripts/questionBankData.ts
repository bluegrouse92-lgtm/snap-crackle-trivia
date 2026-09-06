export interface QuestionTemplate {
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  explanation: string;
  funFact: string;
  hostCommentary: string;
}

export const QUESTION_DATABASE: Record<string, QuestionTemplate[]> = {
  science_nature: [
    {
      question: "Which organelle is considered the 'powerhouse' of the eukaryotic cell?",
      options: ["Mitochondria", "Ribosome", "Endoplasmic Reticulum", "Golgi Apparatus"],
      correctAnswer: "Mitochondria",
      difficulty: "Easy",
      explanation: "Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions through ATP production.",
      funFact: "Mitochondria possess their own unique circular DNA, inherited maternally.",
      hostCommentary: "A biology classic! Don't let your high school teacher down!"
    },
    {
      question: "What is the primary chemical element that constitutes approximately 78% of Earth's atmosphere?",
      options: ["Nitrogen", "Oxygen", "Argon", "Carbon Dioxide"],
      correctAnswer: "Nitrogen",
      difficulty: "Easy",
      explanation: "Nitrogen (N2) makes up about 78.08% of Earth's dry atmosphere, with Oxygen making up roughly 20.95%.",
      funFact: "Nitrogen gas is diatomic, odorless, colorless, and largely unreactive at room temperature.",
      hostCommentary: "Take a deep breath and give me your answer!"
    },
    {
      question: "What phenomenon explains why the sky appears blue during daylight on Earth?",
      options: ["Rayleigh scattering", "Mie scattering", "Tyndall effect", "Atmospheric refraction"],
      correctAnswer: "Rayleigh scattering",
      difficulty: "Medium",
      explanation: "Rayleigh scattering occurs when particles in the atmosphere scatter shorter blue wavelengths more effectively than longer red wavelengths.",
      funFact: "Lord Rayleigh calculated that the scattering intensity is inversely proportional to the fourth power of wavelength (1/λ⁴).",
      hostCommentary: "Looking up at the clouds won't help you with this physics question!"
    },
    {
      question: "Which fundamental force of nature is mediated by the massless gauge boson known as the gluon?",
      options: ["Strong nuclear force", "Electromagnetic force", "Weak nuclear force", "Gravitational force"],
      correctAnswer: "Strong nuclear force",
      difficulty: "Hard",
      explanation: "Gluons act as exchange particles for the strong force between quarks, binding protons and neutrons together inside atomic nuclei.",
      funFact: "Gluons carry 'color charge' themselves, meaning they can interact with other gluons.",
      hostCommentary: "Quantum chromodynamics on a game show? We don't mess around here!"
    },
    {
      question: "What is the speed of light in a vacuum, rounded to the nearest thousand kilometers per second?",
      options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
      correctAnswer: "300,000 km/s",
      difficulty: "Easy",
      explanation: "The exact speed of light in vacuum is defined as 299,792,458 meters per second (~300,000 km/s).",
      funFact: "Light can circle the Earth's equator approximately 7.5 times in a single second.",
      hostCommentary: "Fast as light, but will your buzzer finger be faster?"
    },
    {
      question: "Which enzyme is primarily responsible for unzipping the DNA double helix during DNA replication?",
      options: ["Helicase", "DNA Polymerase", "Ligase", "Topoisomerase"],
      correctAnswer: "Helicase",
      difficulty: "Medium",
      explanation: "DNA Helicase breaks the hydrogen bonds holding the paired complementary bases together, opening up the replication fork.",
      funFact: "Helicases move along the nucleic acid phosphodiester backbone at remarkable speeds, burning ATP.",
      hostCommentary: "Unzip your neural pathways for this molecular mystery!"
    },
    {
      question: "What geological era is often termed the 'Age of Reptiles' and ended approximately 66 million years ago?",
      options: ["Mesozoic Era", "Paleozoic Era", "Cenozoic Era", "Precambrian"],
      correctAnswer: "Mesozoic Era",
      difficulty: "Medium",
      explanation: "The Mesozoic Era encompasses the Triassic, Jurassic, and Cretaceous periods, spanning from 252 to 66 million years ago.",
      funFact: "The Chicxulub asteroid impact in modern-day Mexico marked the abrupt end of the Mesozoic.",
      hostCommentary: "Dinosaur lovers, this is your time to roar!"
    },
    {
      question: "What is the rarest naturally occurring element in the Earth's crust, with less than 30 grams existing at any time?",
      options: ["Astatine", "Francium", "Promethium", "Polonium"],
      correctAnswer: "Astatine",
      difficulty: "Hard",
      explanation: "Astatine is a halogen produced through radioactive decay chains; its half-life is so short that under 30 grams exist globally at once.",
      funFact: "The name Astatine derives from the Greek word 'astatos', meaning unstable.",
      hostCommentary: "A question so rare, scientists barely have a teaspoon of it!"
    },
    {
      question: "What is the chemical formula for ordinary table salt?",
      options: ["NaCl", "KCl", "CaCl2", "Na2SO4"],
      correctAnswer: "NaCl",
      difficulty: "Easy",
      explanation: "Sodium chloride (NaCl) is an ionic compound composed of equal parts sodium and chlorine cations/anions.",
      funFact: "Roman soldiers were occasionally paid an allowance called 'salarium' to purchase salt, the origin of 'salary'.",
      hostCommentary: "Don't get salty if you miss this everyday compound!"
    },
    {
      question: "Which astronomical body in our solar system has the most active volcanoes, featuring sulfur plumes over 300 km high?",
      options: ["Io (Jupiter)", "Enceladus (Saturn)", "Venus", "Europa (Jupiter)"],
      correctAnswer: "Io (Jupiter)",
      difficulty: "Medium",
      explanation: "Io experiences extreme tidal heating from Jupiter and companion moons, making it the most geologically active body in the solar system.",
      funFact: "Io has over 400 active volcanic calderas across its mottled sulfur surface.",
      hostCommentary: "Talk about an explosive question!"
    },
    {
      question: "Which subatomic particle was experimentally discovered by J.J. Thomson in 1897 using cathode ray tubes?",
      options: ["Electron", "Neutron", "Proton", "Positron"],
      correctAnswer: "Electron",
      difficulty: "Medium",
      explanation: "J.J. Thomson demonstrated that cathode rays were composed of previously unknown subatomic particles, initially called 'corpuscles' (electrons).",
      funFact: "Thomson's discovery disproved the ancient philosophical theory that atoms were indivisible.",
      hostCommentary: "Negative charge, positive confidence!"
    },
    {
      question: "What law of thermodynamics states that the entropy of an isolated system never decreases over time?",
      options: ["Second Law", "First Law", "Third Law", "Zeroth Law"],
      correctAnswer: "Second Law",
      difficulty: "Medium",
      explanation: "The Second Law of Thermodynamics dictates that total entropy always increases in spontaneous natural processes.",
      funFact: "The Second Law is frequently cited as defining the unidirectional 'arrow of time'.",
      hostCommentary: "Chaos and entropy! Let's see if your answer brings order to the chaos!"
    },
    {
      question: "What is the only mammal capable of true, sustained flapping flight?",
      options: ["Bat", "Flying Squirrel", "Sugar Glider", "Colugo"],
      correctAnswer: "Bat",
      difficulty: "Easy",
      explanation: "Bats (order Chiroptera) are the only mammals equipped with anatomical wings capable of powered flight, unlike gliding mammals.",
      funFact: "Bat wings are structurally modified mammalian hands with elongated finger bones supporting a thin membrane.",
      hostCommentary: "Spread your wings and grab those points!"
    },
    {
      question: "What cosmological theory posits that the universe underwent an exponential metric expansion in the first fraction of a second?",
      options: ["Cosmic Inflation", "Steady State Theory", "Big Crunch", "Ekpyrotic Universe"],
      correctAnswer: "Cosmic Inflation",
      difficulty: "Hard",
      explanation: "Proposed by Alan Guth in 1979, cosmic inflation explains the cosmic microwave background's uniformity and flat spatial geometry.",
      funFact: "Inflation expanded the observable universe by a factor of at least 10^26 in less than 10^-32 seconds.",
      hostCommentary: "Expanding your mind faster than the early cosmos!"
    },
    {
      question: "Which metal has the highest electrical conductivity of all known elements at room temperature?",
      options: ["Silver", "Copper", "Gold", "Aluminum"],
      correctAnswer: "Silver",
      difficulty: "Medium",
      explanation: "Silver possesses the highest electrical and thermal conductivity of any known metal, though copper is more commonly used due to cost.",
      funFact: "Silver's crystal lattice allows free valence electrons to drift with minimal impedance.",
      hostCommentary: "A gold standard question about a silver prize!"
    }
  ],

  world_history: [
    {
      question: "In what year did the Western Roman Empire traditionally fall with the deposition of Romulus Augustulus?",
      options: ["476 AD", "410 AD", "395 AD", "1453 AD"],
      correctAnswer: "476 AD",
      difficulty: "Medium",
      explanation: "Germanic chieftain Odoacer deposed the teenage emperor Romulus Augustulus in Ravenna in 476 AD.",
      funFact: "The Eastern Roman Empire (Byzantium) survived another thousand years until 1453.",
      hostCommentary: "All roads lead to history! Let's test your ancient timeline!"
    },
    {
      question: "Who was the first female Pharaoh of ancient Egypt to rule with full pharaonic power, famed for her expedition to Punt?",
      options: ["Hatshepsut", "Cleopatra VII", "Nefertiti", "Twosret"],
      correctAnswer: "Hatshepsut",
      difficulty: "Medium",
      explanation: "Hatshepsut ruled Egypt during the 18th Dynasty for roughly two decades, establishing major trade routes and monumental architecture.",
      funFact: "She often had herself depicted in statues with traditional pharaonic regalia, including a royal beard.",
      hostCommentary: "Bow before the queen of the Nile!"
    },
    {
      question: "Which pivotal naval battle in 31 BC established Octavian's undisputed mastery over the Roman world?",
      options: ["Battle of Actium", "Battle of Philippi", "Battle of Salamis", "Battle of Pharsalus"],
      correctAnswer: "Battle of Actium",
      difficulty: "Hard",
      explanation: "Octavian's admiral Marcus Agrippa defeated the combined fleets of Mark Antony and Cleopatra VII off the coast of Greece.",
      funFact: "Octavian was crowned as Augustus four years later in 27 BC, marking the formal start of the Roman Empire.",
      hostCommentary: "The tides of history turned on this naval showdown!"
    },
    {
      question: "What historic document, signed in 1215 at Runnymede, first placed constitutional limits on the English monarchy?",
      options: ["Magna Carta", "Bill of Rights", "Domesday Book", "Petition of Right"],
      correctAnswer: "Magna Carta",
      difficulty: "Easy",
      explanation: "Barons forced King John of England to sign Magna Carta ('Great Charter') establishing that even the monarch was bound by law.",
      funFact: "Clause 39 famously stated no free man could be imprisoned or punished except by lawful judgment of his peers.",
      hostCommentary: "Lay down the law with your answer!"
    },
    {
      question: "Who was the military and political leader who unified feudal Japan and founded the Tokugawa Shogunate in 1603?",
      options: ["Tokugawa Ieyasu", "Oda Nobunaga", "Toyotomi Hideyoshi", "Minamoto no Yoritomo"],
      correctAnswer: "Tokugawa Ieyasu",
      difficulty: "Medium",
      explanation: "After his victory at the Battle of Sekigahara in 1600, Tokugawa Ieyasu was appointed Shogun, inaugurating over 250 years of peace.",
      funFact: "The Tokugawa period (Edo period) relocated Japan's administrative capital to Edo, modern-day Tokyo.",
      hostCommentary: "Sharpen your katana—history is calling!"
    },
    {
      question: "What was the code name for the Allied invasion of Normandy on June 6, 1944?",
      options: ["Operation Overlord", "Operation Barbarossa", "Operation Market Garden", "Operation Torch"],
      correctAnswer: "Operation Overlord",
      difficulty: "Easy",
      explanation: "Operation Overlord was the overall Allied codename for the amphibious assault that opened the Western Front in Europe.",
      funFact: "The naval assault component itself was codenamed Operation Neptune.",
      hostCommentary: "D-Day knowledge incoming!"
    },
    {
      question: "Which ancient civilization developed the cuneiform script, one of the earliest systems of writing in world history?",
      options: ["Sumerians", "Phoenicians", "Hittites", "Babylonians"],
      correctAnswer: "Sumerians",
      difficulty: "Medium",
      explanation: "The Sumerians of southern Mesopotamia developed cuneiform wedge-shaped marks pressed into soft clay around 3400 BC.",
      funFact: "Cuneiform translates from Latin as 'wedge-shaped' (cuneus).",
      hostCommentary: "Carving your name into history right now!"
    },
    {
      question: "What treaty signed in 1648 brought an end to the Thirty Years' War and shaped modern principles of national sovereignty?",
      options: ["Peace of Westphalia", "Treaty of Utrecht", "Treaty of Versailles", "Peace of Augsburg"],
      correctAnswer: "Peace of Westphalia",
      difficulty: "Hard",
      explanation: "The Peace of Westphalia concluded the Thirty Years' War in the Holy Roman Empire, establishing modern diplomatic sovereignty.",
      funFact: "It recognized the independence of the Swiss Confederacy and the Dutch Republic.",
      hostCommentary: "Diplomacy, borders, and treaties! You know your stuff!"
    },
    {
      question: "Who was the legendary Carthaginian general who crossed the Alps with war elephants in 218 BC to invade Italy?",
      options: ["Hannibal Barca", "Hamilcar Barca", "Hasdrubal", "Scipio Africanus"],
      correctAnswer: "Hannibal Barca",
      difficulty: "Easy",
      explanation: "Hannibal Barca led an army of infantry, cavalry, and African war elephants across the Pyrenees and Alps into northern Italy.",
      funFact: "Hannibal inflicted one of Rome's greatest military disasters at the Battle of Cannae in 216 BC.",
      hostCommentary: "An elephant never forgets, and neither should you!"
    },
    {
      question: "Which Aztec emperor was reigning in Tenochtitlan when Spanish conquistador Hernán Cortés arrived in 1519?",
      options: ["Moctezuma II", "Cuauhtémoc", "Cuitláhuac", "Itzcoatl"],
      correctAnswer: "Moctezuma II",
      difficulty: "Medium",
      explanation: "Moctezuma II (Montezuma) was the tlatoani (ruler) of Tenochtitlan who received Cortés before being taken captive in his palace.",
      funFact: "Tenochtitlan was built on islands in Lake Texcoco and was one of the largest cities in the world at the time.",
      hostCommentary: "Gold, pyramids, and conquest!"
    },
    {
      question: "In what year did the Apollo 11 lunar module land the first humans on the Moon?",
      options: ["1969", "1967", "1971", "1972"],
      correctAnswer: "1969",
      difficulty: "Easy",
      explanation: "Neil Armstrong and Buzz Aldrin set foot on the lunar surface on July 20, 1969, during NASA's Apollo 11 mission.",
      funFact: "The lunar module guidance computer operated with approximately 4 KB of RAM and 72 KB of ROM.",
      hostCommentary: "One small step for you, one giant leap on the leaderboard!"
    },
    {
      question: "Which French monarch was famously called the 'Sun King' (le Roi-Soleil) and ruled for over 72 years?",
      options: ["Louis XIV", "Louis XVI", "Louis XIII", "Francis I"],
      correctAnswer: "Louis XIV",
      difficulty: "Easy",
      explanation: "Louis XIV reigned from 1643 until 1715, consolidating absolute royal power and constructing the Palace of Versailles.",
      funFact: "His reign of 72 years and 110 days is the longest verified sovereign reign in European history.",
      hostCommentary: "Bask in the glory of the Sun King!"
    }
  ],

  geography_wonders: [
    {
      question: "What is the deepest known oceanic trench on Earth, plunging nearly 11,000 meters below sea level?",
      options: ["Mariana Trench", "Puerto Rico Trench", "Java Trench", "Tonga Trench"],
      correctAnswer: "Mariana Trench",
      difficulty: "Easy",
      explanation: "The Mariana Trench in the western Pacific Ocean contains Challenger Deep, reaching roughly 10,994 meters (36,070 feet) in depth.",
      funFact: "Water pressure at the bottom of Challenger Deep exceeds 1,000 times standard atmospheric pressure.",
      hostCommentary: "Diving deep into the abyss for this one!"
    },
    {
      question: "What is the capital city of Australia?",
      options: ["Canberra", "Sydney", "Melbourne", "Brisbane"],
      correctAnswer: "Canberra",
      difficulty: "Easy",
      explanation: "Canberra was chosen as the capital in 1908 as a compromise between rival cities Sydney and Melbourne.",
      funFact: "The name Canberra is widely thought to originate from the Ngunnawal word 'Kamberra', meaning 'meeting place'.",
      hostCommentary: "Don't fall into the tourist trap! Sydney is not the capital!"
    },
    {
      question: "Which river is the longest in the world by conventional scientific consensus?",
      options: ["Nile River", "Amazon River", "Yangtze River", "Mississippi-Missouri"],
      correctAnswer: "Nile River",
      difficulty: "Easy",
      explanation: "The Nile River stretches approximately 6,650 km (4,132 miles) through northeastern Africa.",
      funFact: "While the Nile is conventionally longest, the Amazon carries vastly more water than any other river on Earth.",
      hostCommentary: "Flowing down the mighty Nile!"
    },
    {
      question: "Which African country is the only nation on Earth completely enclaved within South Africa?",
      options: ["Lesotho", "Eswatini", "Botswana", "Namibia"],
      correctAnswer: "Lesotho",
      difficulty: "Medium",
      explanation: "The Kingdom of Lesotho is an enclave country entirely surrounded by the Republic of South Africa.",
      funFact: "Lesotho is known as the 'Kingdom in the Sky' because its lowest point is 1,400 meters above sea level—the highest low point of any country.",
      hostCommentary: "A country inside a country! Geography magic!"
    },
    {
      question: "Mount Kilimanjaro, the highest peak in Africa, is located in which nation?",
      options: ["Tanzania", "Kenya", "Uganda", "Ethiopia"],
      correctAnswer: "Tanzania",
      difficulty: "Easy",
      explanation: "Mount Kilimanjaro is a dormant stratovolcano rising 5,895 meters (19,341 feet) in northeastern Tanzania.",
      funFact: "Kilimanjaro is the tallest free-standing mountain in the world not part of a continuous mountain range.",
      hostCommentary: "Climbing to the roof of Africa!"
    },
    {
      question: "What narrow strait separates the Iberian Peninsula from Morocco and connects the Atlantic to the Mediterranean?",
      options: ["Strait of Gibraltar", "Bosphorus Strait", "Strait of Malacca", "Dardanelles"],
      correctAnswer: "Strait of Gibraltar",
      difficulty: "Easy",
      explanation: "The Strait of Gibraltar is only about 14 km (8.9 miles) wide at its narrowest point between Spain and Morocco.",
      funFact: "The ancient Greeks and Romans called the mountains framing the strait the 'Pillars of Hercules'.",
      hostCommentary: "Navigating between continents!"
    },
    {
      question: "Which sea is the saltiest open-water landlocked body of water, famous for allowing swimmers to float effortlessly?",
      options: ["Dead Sea", "Caspian Sea", "Red Sea", "Aral Sea"],
      correctAnswer: "Dead Sea",
      difficulty: "Easy",
      explanation: "The Dead Sea borders Jordan, Israel, and Palestine with a salinity of roughly 34%, roughly 9.6 times saltier than the ocean.",
      funFact: "The surface and shores of the Dead Sea are 430.5 meters below sea level, Earth's lowest elevation on land.",
      hostCommentary: "Float to victory on this answer!"
    },
    {
      question: "Which country possesses the most natural lakes in the world, with over 60% of the planet's total?",
      options: ["Canada", "Russia", "Finland", "Sweden"],
      correctAnswer: "Canada",
      difficulty: "Medium",
      explanation: "Canada contains an estimated 2 million lakes, covering nearly 9% of the country's surface area.",
      funFact: "While Finland is known as 'The Land of a Thousand Lakes', Canada actually has hundreds of times more.",
      hostCommentary: "Fresh water, cool breeze, hot points!"
    },
    {
      question: "What is the capital city of Kazakhstan, which was briefly renamed Nur-Sultan between 2019 and 2022?",
      options: ["Astana", "Almaty", "Shymkent", "Tashkent"],
      correctAnswer: "Astana",
      difficulty: "Medium",
      explanation: "Astana became the capital in 1997, was renamed Nur-Sultan in 2019, and was restored to Astana in September 2022.",
      funFact: "Astana is the second-coldest national capital in the world after Ulaanbaatar, Mongolia.",
      hostCommentary: "Steppe up and name that capital!"
    },
    {
      question: "Which colossal waterfall system spanning Argentina and Brazil consists of up to 275 individual drops including 'Devil's Throat'?",
      options: ["Iguazu Falls", "Victoria Falls", "Angel Falls", "Niagara Falls"],
      correctAnswer: "Iguazu Falls",
      difficulty: "Medium",
      explanation: "Iguazu Falls are waterfalls of the Iguazu River on the border of Argentina's Misiones province and Brazil's Paraná state.",
      funFact: "First lady Eleanor Roosevelt reportedly exclaimed 'Poor Niagara!' upon viewing Iguazu.",
      hostCommentary: "Feel the thunder of this cascading wonder!"
    }
  ],

  pop_culture_gaming: [
    {
      question: "In the 1985 NES classic 'Super Mario Bros.', what is the profession of the protagonist Mario?",
      options: ["Plumber", "Carpenter", "Electrician", "Architect"],
      correctAnswer: "Plumber",
      difficulty: "Easy",
      explanation: "While Mario was originally a carpenter in the 1981 arcade game Donkey Kong, Super Mario Bros. established him as a Brooklyn plumber.",
      funFact: "Mario's original character design was named 'Jumpman' by creator Shigeru Miyamoto.",
      hostCommentary: "It's-a-me! Free points if you know gaming history!"
    },
    {
      question: "Which iconic 1980 arcade game was originally titled 'Puck Man' in Japan before being localized for North America?",
      options: ["Pac-Man", "Galaga", "Dig Dug", "Space Invaders"],
      correctAnswer: "Pac-Man",
      difficulty: "Easy",
      explanation: "Midway changed the name from Puck Man to Pac-Man in North America to prevent arcade vandals from altering the 'P' to an 'F'.",
      funFact: "Creator Toru Iwatani stated the character's shape was inspired by a pizza missing a slice.",
      hostCommentary: "Waka waka! Gobble up those points!"
    },
    {
      question: "What is the name of the fantasy continent where most of CD Projekt Red's 'The Witcher' takes place?",
      options: ["The Continent", "Tamriel", "Faerûn", "The Lands Between"],
      correctAnswer: "The Continent",
      difficulty: "Medium",
      explanation: "In Andrzej Sapkowski's lore and the game series, the main setting is simply referred to as 'The Continent'.",
      funFact: "The Continent was populated by elves, dwarves, and gnomes before the cataclysmic 'Conjunction of the Spheres' brought humans and monsters.",
      hostCommentary: "Toss a coin to your game show host!"
    },
    {
      question: "Who composed the iconic musical themes for 'Star Wars', 'Indiana Jones', and 'Jurassic Park'?",
      options: ["John Williams", "Hans Zimmer", "Ennio Morricone", "Howard Shore"],
      correctAnswer: "John Williams",
      difficulty: "Easy",
      explanation: "John Williams is one of the most celebrated film composers in history, with over 50 Academy Award nominations.",
      funFact: "Williams has won five Oscars and composed the themes for four separate Olympic Games.",
      hostCommentary: "Cue the orchestral fanfare!"
    },
    {
      question: "In Valve's puzzle-platformer 'Portal', what is the name of the sarcastic rogue AI who guides and taunts the player?",
      options: ["GLaDOS", "SHODAN", "Cortana", "HAL 9000"],
      correctAnswer: "GLaDOS",
      difficulty: "Easy",
      explanation: "GLaDOS (Genetic Lifeform and Disk Operating System) is the passive-aggressive AI antagonist voiced by Ellen McLain.",
      funFact: "The cake may be a lie, but this trivia point is 100% real.",
      hostCommentary: "This was a triumph. I'm making a note here: huge success!"
    },
    {
      question: "Which 1994 film won six Academy Awards, including Best Picture, Best Director, and Best Actor for Tom Hanks?",
      options: ["Forrest Gump", "Pulp Fiction", "The Shawshank Redemption", "Four Weddings and a Funeral"],
      correctAnswer: "Forrest Gump",
      difficulty: "Easy",
      explanation: "Forrest Gump was a massive commercial and critical triumph at the 67th Academy Awards in 1995.",
      funFact: "1994 is widely cited as one of the greatest film release years in modern Hollywood history.",
      hostCommentary: "Life is like a box of trivia questions!"
    },
    {
      question: "What game franchise popularized the term 'Battle Royale' in video gaming and broke early Twitch records in 2017?",
      options: ["PUBG: Battlegrounds", "Fortnite", "Apex Legends", "Call of Duty: Warzone"],
      correctAnswer: "PUBG: Battlegrounds",
      difficulty: "Medium",
      explanation: "PlayerUnknown's Battlegrounds developed by Brendan Greene launched into Steam Early Access in March 2017, catalyzing the genre.",
      funFact: "PUBG peaked at over 3.2 million simultaneous players on Steam, a record that stood for years.",
      hostCommentary: "Winner winner, chicken dinner!"
    },
    {
      question: "Which legendary video game hero wields the Master Sword and protects the kingdom of Hyrule?",
      options: ["Link", "Zelda", "Ganon", "Pit"],
      correctAnswer: "Link",
      difficulty: "Easy",
      explanation: "Link is the courageous protagonist of Nintendo's The Legend of Zelda series; Princess Zelda is the royal he frequently rescues.",
      funFact: "Miyamoto named Link because the character was originally conceived to link past and future eras.",
      hostCommentary: "It's dangerous to go alone! Take this trivia point!"
    },
    {
      question: "What is the highest-grossing media franchise of all time, surpassing $100 billion in total revenue?",
      options: ["Pokémon", "Star Wars", "Mickey Mouse", "Marvel Cinematic Universe"],
      correctAnswer: "Pokémon",
      difficulty: "Medium",
      explanation: "Created by Satoshi Tajiri in 1996, Pokémon is estimated to be the highest-grossing franchise in history via merchandise, games, and media.",
      funFact: "Pikachu was not originally chosen to be the main mascot; Clefairy was the original candidate.",
      hostCommentary: "Gotta catch 'em all—including this question!"
    }
  ],

  literature_arts: [
    {
      question: "Who painted the enigmatic portrait 'Mona Lisa' (La Gioconda) in the early 16th century?",
      options: ["Leonardo da Vinci", "Michelangelo", "Raphael", "Sandro Botticelli"],
      correctAnswer: "Leonardo da Vinci",
      difficulty: "Easy",
      explanation: "Leonardo da Vinci worked on the Mona Lisa between 1503 and his death in France in 1519.",
      funFact: "The portrait hangs in the Louvre behind bulletproof glass and has been displayed there since 1797.",
      hostCommentary: "An enigmatic smile for an artistic mastermind!"
    },
    {
      question: "Which dystopian novel by George Orwell introduces the concepts of 'Big Brother', 'Doublethink', and 'Newspeak'?",
      options: ["1984", "Animal Farm", "Brave New World", "Fahrenheit 451"],
      correctAnswer: "1984",
      difficulty: "Easy",
      explanation: "Published in 1949, Orwell's 1984 portrays the totalitarian regime of Oceania led by the omnipresent Big Brother.",
      funFact: "Orwell's working title for the book was originally 'The Last Man in Europe'.",
      hostCommentary: "Big Brother is watching your score!"
    },
    {
      question: "Who sculpted the monumental marble statue of 'David' between 1501 and 1504 in Florence?",
      options: ["Michelangelo", "Donatello", "Gian Lorenzo Bernini", "Canova"],
      correctAnswer: "Michelangelo",
      difficulty: "Easy",
      explanation: "Michelangelo Buonarroti sculpted David from a single block of Carrara marble when he was only 26 years old.",
      funFact: "The block of marble had been abandoned by other sculptors for over 40 years because they considered it flawed.",
      hostCommentary: "A colossal masterpiece of Renaissance intellect!"
    },
    {
      question: "In Dante Alighieri's 'Divine Comedy', which classical Roman poet serves as Dante's guide through Hell and Purgatory?",
      options: ["Virgil", "Ovid", "Horace", "Homer"],
      correctAnswer: "Virgil",
      difficulty: "Medium",
      explanation: "Virgil, author of the Aeneid, acts as Dante's guide representing human reason through Inferno and Purgatorio.",
      funFact: "Virgil cannot guide Dante through Paradiso because he was born before Christ and resides in Limbo.",
      hostCommentary: "Abandon all incorrect answers, ye who enter here!"
    },
    {
      question: "Which Dutch Post-Impressionist master painted 'The Starry Night' while staying at the Saint-Paul asylum in Saint-Rémy in 1889?",
      options: ["Vincent van Gogh", "Johannes Vermeer", "Rembrandt van Rijn", "Piet Mondrian"],
      correctAnswer: "Vincent van Gogh",
      difficulty: "Easy",
      explanation: "Van Gogh painted 'The Starry Night' depicting the view from his east-facing asylum window just before sunrise.",
      funFact: "Van Gogh only sold one known painting during his lifetime, 'The Red Vineyard'.",
      hostCommentary: "A swirling vortex of artistic genius!"
    },
    {
      question: "What Greek epic poem attributed to Homer recounts the ten-year journey of the King of Ithaca returning from Troy?",
      options: ["The Odyssey", "The Iliad", "The Aeneid", "The Argonautica"],
      correctAnswer: "The Odyssey",
      difficulty: "Easy",
      explanation: "The Odyssey tells the trials of Odysseus facing monsters, gods, and sirens on his voyage home to his wife Penelope.",
      funFact: "The ancient Greek word 'nostos' (homecoming) forms the linguistic root of the modern word 'nostalgia'.",
      hostCommentary: "An epic voyage through high-culture trivia!"
    },
    {
      question: "Which Russian author penned the epic psychological masterpieces 'Crime and Punishment' and 'The Brothers Karamazov'?",
      options: ["Fyodor Dostoevsky", "Leo Tolstoy", "Anton Chekhov", "Ivan Turgenev"],
      correctAnswer: "Fyodor Dostoevsky",
      difficulty: "Medium",
      explanation: "Dostoevsky is recognized as one of the greatest novelists in world literature, exploring existentialism and moral philosophy.",
      funFact: "In 1849, Dostoevsky faced a mock execution by firing squad before his sentence was commuted to Siberian exile.",
      hostCommentary: "No punishment here, just pure trivia reward!"
    },
    {
      question: "What art movement, led by Salvador Dalí and René Magritte, sought to unlock the unconscious mind through dreamlike imagery?",
      options: ["Surrealism", "Cubism", "Dadaism", "Expressionism"],
      correctAnswer: "Surrealism",
      difficulty: "Medium",
      explanation: "Surrealism officially began in Paris in 1924 with André Breton's 'Manifesto of Surrealism'.",
      funFact: "Dalí once arrived at a lecture at the London International Surrealist Exhibition wearing a deep-sea diving suit.",
      hostCommentary: "Melting clocks and dreamscapes ahead!"
    }
  ],

  breaking_news: [
    {
      question: "Which NASA flagship space observatory launched in December 2021 opened infrared views of the earliest galaxies?",
      options: ["James Webb Space Telescope (JWST)", "Hubble Space Telescope", "Nancy Grace Roman Telescope", "Spitzer Space Telescope"],
      correctAnswer: "James Webb Space Telescope (JWST)",
      difficulty: "Easy",
      explanation: "The JWST orbits the Sun-Earth L2 Lagrange point 1.5 million kilometers from Earth, capturing infrared light from the early universe.",
      funFact: "JWST's primary mirror consists of 18 hexagonal beryllium segments coated in vapor-deposited pure gold.",
      hostCommentary: "Looking all the way back to the dawn of cosmic time!"
    },
    {
      question: "NASA's Artemis program aims to return human astronauts to the surface of which celestial body for the first time since 1972?",
      options: ["The Moon", "Mars", "Europa", "Titan"],
      correctAnswer: "The Moon",
      difficulty: "Easy",
      explanation: "The Artemis program plans to land the first woman and first person of color on the lunar South Pole.",
      funFact: "Artemis is named after the twin sister of Apollo in Greek mythology, the goddess of the Moon.",
      hostCommentary: "Lunar launchpad ready! Blast off!"
    },
    {
      question: "In nuclear fusion research, which landmark US laboratory achieved net energy gain ('fusion ignition') for the first time in December 2022?",
      options: ["National Ignition Facility (LLNL)", "MIT Plasma Science Center", "Princeton Plasma Physics Lab", "ITER Project"],
      correctAnswer: "National Ignition Facility (LLNL)",
      difficulty: "Hard",
      explanation: "Scientists at Lawrence Livermore National Laboratory used 192 ultraviolet lasers to produce 3.15 megajoules from 2.05 megajoules of laser energy.",
      funFact: "The target capsule holding deuterium and tritium was roughly the size of a peppercorn.",
      hostCommentary: "Harnessing the power of the stars right here on Earth!"
    },
    {
      question: "What international sports tournament held in France in summer 2024 featured the first outdoor opening ceremony along the River Seine?",
      options: ["Paris 2024 Summer Olympics", "FIFA World Cup", "Tour de France Centenary", "Rugby World Cup"],
      correctAnswer: "Paris 2024 Summer Olympics",
      difficulty: "Easy",
      explanation: "The 2024 Summer Olympics in Paris held their spectacular opening parade of athletes on boats traveling down the Seine.",
      funFact: "It was the third time Paris hosted the Summer Olympic Games (previously 1900 and 1924).",
      hostCommentary: "Gold medals and trivia points on the line!"
    },
    {
      question: "Which open-source large language model family was released by Meta AI, igniting widespread commercial local AI deployment?",
      options: ["Llama", "Claude", "Gemma", "Mistral"],
      correctAnswer: "Llama",
      difficulty: "Medium",
      explanation: "Meta released the Llama (Large Language Model Meta AI) architecture with weights openly available for researchers and developers.",
      funFact: "Llama was initially released in early 2023 and quickly spurred a massive open-source AI ecosystem.",
      hostCommentary: "AI quizzing you on AI? What a modern world!"
    },
    {
      question: "What major global climate milestone was repeatedly recorded between 2023 and 2024 by Copernicus Climate Change Service?",
      options: ["Hottest year on modern record", "Lowest atmospheric CO2 in a decade", "Complete Arctic ice recovery", "Global ocean cooling event"],
      correctAnswer: "Hottest year on modern record",
      difficulty: "Easy",
      explanation: "Global surface temperatures in 2023-2024 exceeded pre-industrial baselines by unprecedented margins.",
      funFact: "2023 was officially confirmed by Copernicus and NOAA as the warmest calendar year since global records began in 1850.",
      hostCommentary: "The heat is on! Stay cool and lock in your answer!"
    }
  ],

  all_mix: [
    {
      question: "Which fruit has its seeds on the outside rather than enclosed within a protective fleshy interior?",
      options: ["Strawberry", "Pineapple", "Blackberry", "Raspberry"],
      correctAnswer: "Strawberry",
      difficulty: "Easy",
      explanation: "Botanically speaking, the little yellow specks on a strawberry are individual fruits called achenes, each containing a seed.",
      funFact: "A strawberry is technically an aggregate accessory fruit, not a true berry in botanical classification.",
      hostCommentary: "Sweet, juicy trivia for the curious mind!"
    },
    {
      question: "What is the only chess piece that cannot be captured under standard international FIDE rules?",
      options: ["King", "Queen", "Knight", "Rook"],
      correctAnswer: "King",
      difficulty: "Easy",
      explanation: "In chess, the King is placed in checkmate rather than physically removed or captured off the board.",
      funFact: "The Persian phrase 'Shāh māt' translates literally to 'the King is helpless/dead', giving us 'checkmate'.",
      hostCommentary: "Checkmate! Show me your grandmaster moves!"
    },
    {
      question: "What musical instrument features 88 keys, spanning seven octaves plus a minor third?",
      options: ["Piano", "Harpsichord", "Celesta", "Pipe Organ"],
      correctAnswer: "Piano",
      difficulty: "Easy",
      explanation: "A standard modern piano has 52 white keys and 36 black keys, totaling 88 keys.",
      funFact: "The acoustic piano was invented in Italy around 1700 by Bartolomeo Cristofori.",
      hostCommentary: "Tickle the ivories and hit the right note!"
    },
    {
      question: "Which animal group has three hearts, blue hemocyanin blood, and a ring-shaped brain encircling their esophagus?",
      options: ["Octopuses", "Jellyfish", "Sharks", "Crabs"],
      correctAnswer: "Octopuses",
      difficulty: "Medium",
      explanation: "Octopuses have two branchial hearts pumping blood to the gills and one systemic heart for the body, utilizing copper-based hemocyanin.",
      funFact: "Two-thirds of an octopus's neurons are located in its arms rather than its central brain.",
      hostCommentary: "Tentacles, intellect, and three beating hearts!"
    },
    {
      question: "What is the standard measurement unit used to determine the height of horses, equivalent to 4 inches (10.16 cm)?",
      options: ["Hand", "Span", "Pace", "Cubits"],
      correctAnswer: "Hand",
      difficulty: "Medium",
      explanation: "In equestrian circles, a horse's height at the withers is measured in 'hands', where 1 hand = 4 inches.",
      funFact: "The unit originated from the ancient custom of measuring horses using the breadth of an adult human palm.",
      hostCommentary: "Giddy up! Don't horse around on this one!"
    },
    {
      question: "Which ancient wonder of the world is the only one that still largely stands intact today?",
      options: ["Great Pyramid of Giza", "Colossus of Rhodes", "Lighthouse of Alexandria", "Hanging Gardens of Babylon"],
      correctAnswer: "Great Pyramid of Giza",
      difficulty: "Easy",
      explanation: "Built for Pharaoh Khufu around 2560 BC, the Great Pyramid of Giza is the oldest and only surviving ancient wonder.",
      funFact: "The Great Pyramid remained the tallest man-made structure in the world for over 3,800 years.",
      hostCommentary: "Standing the test of millennia!"
    },
    {
      question: "What is the term for a word, phrase, or sequence that reads the exact same backward as forward, such as 'radar' or 'racecar'?",
      options: ["Palindrome", "Anagram", "Portmanteau", "Oxymoron"],
      correctAnswer: "Palindrome",
      difficulty: "Easy",
      explanation: "A palindrome is a word or phrase that spells identically forwards and backwards.",
      funFact: "The longest single-word palindrome recognized by Guinness World Records is the Finnish word 'saippuakivikauppias' (soapstone vendor).",
      hostCommentary: "Backwards and forwards, you've got this!"
    },
    {
      question: "What color is the black box (flight data recorder) on commercial airplanes?",
      options: ["Bright Orange", "Pitch Black", "Neon Yellow", "Silver Metallic"],
      correctAnswer: "Bright Orange",
      difficulty: "Easy",
      explanation: "Flight data and cockpit voice recorders are painted high-visibility bright orange with reflective strips to facilitate search and recovery.",
      funFact: "Black boxes are designed to withstand temperatures over 1,100°C (2,000°F) and underwater pressure down to 20,000 feet.",
      hostCommentary: "Don't let the name fool you!"
    }
  ]
};
