// Base de datos de recetas del mundo
const recipesDatabase = [
    {
        id: 1,
        nombre: "Pancakes americanos",
        pais: "Estados Unidos",
        imagen: "🥞",
        tiempo: 30,
        categorias: ["desayunos", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Harina de trigo", cantidad: "200g", icono: "🌾" },
            { nombre: "Azúcar", cantidad: "30g", icono: "🍬" },
            { nombre: "Polvo para hornear", cantidad: "10g", icono: "⚪" },
            { nombre: "Sal", cantidad: "2g", icono: "🧂" },
            { nombre: "Leche", cantidad: "240ml", icono: "🥛" },
            { nombre: "Huevo", cantidad: "1", icono: "🥚" },
            { nombre: "Aceite vegetal", cantidad: "30ml", icono: "🛢️" },
            { nombre: "Vainilla", cantidad: "5ml", icono: "🌸" },
            { nombre: "Mantequilla", cantidad: "10g", icono: "🧈" }
        ],
        instrucciones: [
            "Mezcla los ingredientes secos: harina, azúcar, polvo para hornear y sal",
            "En otro recipiente, bate los ingredientes líquidos: leche, huevo, aceite y vainilla",
            "Vierte la mezcla líquida en los secos y mezcla suavemente",
            "Deja reposar 5 minutos",
            "Calienta una sartén a fuego medio con mantequilla",
            "Vierte 1/4 de taza de mezcla por pancake",
            "Cocina 2-3 minutos hasta que aparezcan burbujas, luego voltea",
            "Cocina 1-2 minutos más del otro lado",
            "Sirve con miel de maple, mantequilla y fruta fresca"
        ],
        calificacion: 4.8,
        resenas: 125
    },
    {
        id: 2,
        nombre: "Smoothie bowl",
        pais: "Estados Unidos",
        imagen: "🍓",
        tiempo: 15,
        categorias: ["desayunos", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Plátanos congelados", cantidad: "240g", icono: "🍌" },
            { nombre: "Fresas congeladas", cantidad: "150g", icono: "🍓" },
            { nombre: "Leche", cantidad: "120ml", icono: "🥛" },
            { nombre: "Miel", cantidad: "15ml", icono: "🍯" },
            { nombre: "Granola", cantidad: "30g", icono: "🌾" },
            { nombre: "Chía", cantidad: "15g", icono: "⚫" },
            { nombre: "Coco rallado", cantidad: "20g", icono: "🥥" }
        ],
        instrucciones: [
            "Coloca los plátanos y fresas congelados en la licuadora",
            "Añade la leche y la miel",
            "Licúa a velocidad alta durante 2-3 minutos hasta obtener textura espesa",
            "Vierte en bowls",
            "Alisa la superficie con una espátula",
            "Decora con granola, chía, rodajas de plátano fresco y coco rallado"
        ],
        calificacion: 4.7,
        resenas: 98
    },
    {
        id: 3,
        nombre: "Yogurt con granola",
        pais: "Estados Unidos",
        imagen: "🥣",
        tiempo: 8,
        categorias: ["desayunos", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Yogurt natural", cantidad: "500g", icono: "🥛" },
            { nombre: "Granola", cantidad: "60g", icono: "🌾" },
            { nombre: "Miel", cantidad: "30ml", icono: "🍯" },
            { nombre: "Plátano", cantidad: "1", icono: "🍌" },
            { nombre: "Fresas", cantidad: "100g", icono: "🍓" },
            { nombre: "Almendras", cantidad: "30g", icono: "🌰" },
            { nombre: "Chía", cantidad: "15g", icono: "⚫" }
        ],
        instrucciones: [
            "Corta las fresas en rebanadas finas",
            "Pela y rebana el plátano",
            "Coloca 250g de yogurt en cada tazón",
            "Añade granola encima",
            "Decora con rodajas de fruta",
            "Baña con miel y espolvorea con chía y almendras"
        ],
        calificacion: 4.6,
        resenas: 87
    },
    {
        id: 4,
        nombre: "Arepas venezolanas",
        pais: "Venezuela",
        imagen: "🥞",
        tiempo: 30,
        categorias: ["desayunos", "comidas", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Harina de maíz precocida", cantidad: "300g", icono: "🌾" },
            { nombre: "Agua tibia", cantidad: "600ml", icono: "💧" },
            { nombre: "Sal", cantidad: "5g", icono: "🧂" },
            { nombre: "Aceite", cantidad: "15ml", icono: "🛢️" },
            { nombre: "Queso rallado", cantidad: "150g", icono: "🧀" },
            { nombre: "Jamón", cantidad: "100g", icono: "🍖" },
            { nombre: "Aguacate", cantidad: "1", icono: "🥑" }
        ],
        instrucciones: [
            "Calienta el agua y agrega la sal",
            "Añade poco a poco la harina de maíz mientras mezclas con las manos",
            "Amasa durante 5-7 minutos hasta obtener una masa suave",
            "Deja reposar 5 minutos",
            "Divide en 6 bolas y aplánalas en discos de 1cm de espesor",
            "Calienta aceite en una sartén a fuego medio-alto",
            "Fríe las arepas 3-4 minutos por lado hasta que se doren",
            "Abre por la mitad y rellena con queso, jamón y aguacate"
        ],
        calificacion: 4.7,
        resenas: 142
    },
    {
        id: 5,
        nombre: "Huevos rancheros",
        pais: "México",
        imagen: "🍳",
        tiempo: 20,
        categorias: ["desayunos", "comidas", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Huevos", cantidad: "2", icono: "🥚" },
            { nombre: "Tortillas de maíz", cantidad: "2", icono: "🌮" },
            { nombre: "Salsa roja", cantidad: "200ml", icono: "🌶️" },
            { nombre: "Cebolla", cantidad: "½", icono: "🧅" },
            { nombre: "Cilantro", cantidad: "10g", icono: "🌿" },
            { nombre: "Queso fresco", cantidad: "50g", icono: "🧀" },
            { nombre: "Aceite", cantidad: "30ml", icono: "🛢️" },
            { nombre: "Frijoles refritos", cantidad: "150g", icono: "🫘" }
        ],
        instrucciones: [
            "Calienta una sartén con aceite",
            "Calienta las tortillas en la sartén unos segundos de cada lado",
            "Coloca las tortillas en un plato",
            "En la misma sartén, calienta la salsa roja",
            "Vierte la salsa sobre las tortillas",
            "Fríe los huevos al gusto en la sartén",
            "Coloca un huevo sobre cada tortilla",
            "Decora con cebolla, cilantro y queso fresco",
            "Sirve con frijoles refritos al lado"
        ],
        calificacion: 4.8,
        resenas: 156
    },
    {
        id: 6,
        nombre: "Chilaquiles rojos",
        pais: "México",
        imagen: "🌶️",
        tiempo: 25,
        categorias: ["desayunos", "comidas", "baratas"],
        ingredientes: [
            { nombre: "Tortillas de maíz", cantidad: "6", icono: "🌮" },
            { nombre: "Salsa roja", cantidad: "300ml", icono: "🌶️" },
            { nombre: "Huevos", cantidad: "2", icono: "🥚" },
            { nombre: "Queso fresco", cantidad: "100g", icono: "🧀" },
            { nombre: "Cebolla", cantidad: "½", icono: "🧅" },
            { nombre: "Cilantro", cantidad: "15g", icono: "🌿" },
            { nombre: "Crema", cantidad: "100ml", icono: "🥛" },
            { nombre: "Aceite", cantidad: "40ml", icono: "🛢️" }
        ],
        instrucciones: [
            "Corta las tortillas en triángulos",
            "Calienta aceite en una sartén",
            "Fríe los triángulos de tortilla hasta que estén crujientes",
            "Retira y coloca en un plato",
            "En la misma sartén, calienta la salsa roja",
            "Vuelve a agregar las tortillas fritas a la salsa",
            "Mezcla bien para que se empajen",
            "Fríe 2 huevos y coloca encima",
            "Decora con queso, cebolla, cilantro y crema"
        ],
        calificacion: 4.7,
        resenas: 134
    },
    {
        id: 7,
        nombre: "Desayuno japonés tradicional",
        pais: "Japón",
        imagen: "🍚",
        tiempo: 35,
        categorias: ["desayunos"],
        ingredientes: [
            { nombre: "Arroz cocido", cantidad: "300g", icono: "🍚" },
            { nombre: "Sopa miso", cantidad: "500ml", icono: "🍲" },
            { nombre: "Huevo", cantidad: "2", icono: "🥚" },
            { nombre: "Nori (alga)", cantidad: "2 láminas", icono: "🪴" },
            { nombre: "Rábano daikon", cantidad: "50g", icono: "🤍" },
            { nombre: "Cebolletas", cantidad: "20g", icono: "🌿" },
            { nombre: "Tofu", cantidad: "150g", icono: "⬜" },
            { nombre: "Salmón", cantidad: "100g", icono: "🐟" }
        ],
        instrucciones: [
            "Cuece el arroz blanco al vapor",
            "Prepara la sopa miso hirviendo agua y disolviendo la pasta",
            "Fríe 2 huevos",
            "Pela y ralla el rábano daikon",
            "Hierve el tofu en caldo durante 5 minutos",
            "Coloca el arroz en un tazón",
            "Coloca un huevo frito encima",
            "Sirve la sopa miso en un tazón aparte",
            "Acompaña con alga nori, daikon rallado, cebolletas y salmón"
        ],
        calificacion: 4.6,
        resenas: 89
    },
    {
        id: 8,
        nombre: "Tostadas con aguacate",
        pais: "México",
        imagen: "🥑",
        tiempo: 12,
        categorias: ["desayunos", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Pan integral", cantidad: "2 rebanadas", icono: "🍞" },
            { nombre: "Aguacate", cantidad: "1", icono: "🥑" },
            { nombre: "Limón", cantidad: "½", icono: "🍋" },
            { nombre: "Sal", cantidad: "2g", icono: "🧂" },
            { nombre: "Tomate", cantidad: "1", icono: "🍅" },
            { nombre: "Cebolla", cantidad: "¼", icono: "🧅" },
            { nombre: "Cilantro", cantidad: "5g", icono: "🌿" },
            { nombre: "Huevo", cantidad: "1", icono: "🥚" }
        ],
        instrucciones: [
            "Tuesta las rebanadas de pan en la tostadora",
            "Parte el aguacate por la mitad y extrae la pulpa",
            "Machaca el aguacate con un tenedor",
            "Exprime limón sobre el aguacate y agrega sal",
            "Pica finamente el tomate y la cebolla",
            "Unta el aguacate sobre el pan tostado",
            "Añade el tomate y cebolla picados",
            "Decora con cilantro",
            "Opcional: agrega un huevo frito encima"
        ],
        calificacion: 4.5,
        resenas: 112
    },
    {
        id: 9,
        nombre: "Enchiladas de desayuno",
        pais: "México",
        imagen: "🌶️",
        tiempo: 35,
        categorias: ["desayunos", "comidas"],
        ingredientes: [
            { nombre: "Tortillas de harina", cantidad: "6", icono: "🌮" },
            { nombre: "Huevos", cantidad: "4", icono: "🥚" },
            { nombre: "Salsa verde", cantidad: "300ml", icono: "🟢" },
            { nombre: "Queso Oaxaca", cantidad: "200g", icono: "🧀" },
            { nombre: "Cebolla", cantidad: "½", icono: "🧅" },
            { nombre: "Papas cocidas", cantidad: "200g", icono: "🥔" },
            { nombre: "Crema", cantidad: "100ml", icono: "🥛" },
            { nombre: "Aceite", cantidad: "40ml", icono: "🛢️" }
        ],
        instrucciones: [
            "Cuece y pela las papas, córtalas en cubos",
            "Revuelve los huevos con las papas",
            "Calienta aceite en una sartén",
            "Rellena cada tortilla con la mezcla de huevo y papa",
            "Enrolla las tortillas",
            "Coloca las enchiladas en un refractario engrasado",
            "Vierte la salsa verde sobre las enchiladas",
            "Espolvora el queso rallado",
            "Hornea a 180°C durante 15 minutos",
            "Decora con crema y cilantro"
        ],
        calificacion: 4.6,
        resenas: 98
    },
    {
        id: 10,
        nombre: "Croissants franceses",
        pais: "Francia",
        imagen: "🥐",
        tiempo: 240,
        categorias: ["desayunos", "postres"],
        ingredientes: [
            { nombre: "Harina de trigo", cantidad: "500g", icono: "🌾" },
            { nombre: "Agua", cantidad: "280ml", icono: "💧" },
            { nombre: "Mantequilla fría", cantidad: "250g", icono: "🧈" },
            { nombre: "Azúcar", cantidad: "50g", icono: "🍬" },
            { nombre: "Sal", cantidad: "10g", icono: "🧂" },
            { nombre: "Levadura", cantidad: "7g", icono: "⚪" },
            { nombre: "Huevo", cantidad: "1", icono: "🥚" }
        ],
        instrucciones: [
            "Mezcla harina, azúcar, sal y levadura",
            "Añade agua gradualmente hasta formar una masa",
            "Amasa durante 10 minutos",
            "Coloca la mantequilla entre dos capas de masa",
            "Realiza los pliegues: dobla, gira 90° y repite 3 veces",
            "Descansa entre cada plegue (20 minutos)",
            "Después del último plegue, refrigera 30 minutos",
            "Corta en triángulos y enrolla",
            "Deja levar 2 horas",
            "Barniza con huevo y hornea a 200°C por 20-25 minutos"
        ],
        calificacion: 4.9,
        resenas: 178
    },
    {
        id: 11,
        nombre: "Huevos benedictinos",
        pais: "Estados Unidos",
        imagen: "🍳",
        tiempo: 30,
        categorias: ["desayunos", "comidas"],
        ingredientes: [
            { nombre: "Huevos", cantidad: "4", icono: "🥚" },
            { nombre: "Pan inglés", cantidad: "2 rebanadas", icono: "🍞" },
            { nombre: "Jamón", cantidad: "100g", icono: "🍖" },
            { nombre: "Mantequilla", cantidad: "150g", icono: "🧈" },
            { nombre: "Yema de huevo", cantidad: "3", icono: "🟡" },
            { nombre: "Limón", cantidad: "½", icono: "🍋" },
            { nombre: "Sal", cantidad: "3g", icono: "🧂" },
            { nombre: "Pimienta de cayena", cantidad: "1g", icono: "🌶️" }
        ],
        instrucciones: [
            "Calienta agua con vinagre en una olla profunda",
            "Hierve agua y cocina los huevos escalfados (3-4 minutos)",
            "Tuesta las rebanadas de pan",
            "Calienta el jamón en una sartén",
            "Para la salsa holandesa: derrite mantequilla lentamente",
            "En un tazón al baño maría, bate las yemas de huevo",
            "Añade la mantequilla derretida gota a gota mientras bates",
            "Añade jugo de limón, sal y pimienta de cayena",
            "Coloca el pan tostado en un plato",
            "Agrega jamón encima del pan",
            "Coloca el huevo escalfado sobre el jamón",
            "Vierte la salsa holandesa encima"
        ],
        calificacion: 4.8,
        resenas: 145
    },
    {
        id: 12,
        nombre: "Pan francés (French toast)",
        pais: "Francia",
        imagen: "🍞",
        tiempo: 20,
        categorias: ["desayunos", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Pan blanco", cantidad: "4 rebanadas", icono: "🍞" },
            { nombre: "Huevos", cantidad: "3", icono: "🥚" },
            { nombre: "Leche", cantidad: "120ml", icono: "🥛" },
            { nombre: "Azúcar", cantidad: "30g", icono: "🍬" },
            { nombre: "Vainilla", cantidad: "5ml", icono: "🌸" },
            { nombre: "Canela", cantidad: "2g", icono: "🥄" },
            { nombre: "Mantequilla", cantidad: "30g", icono: "🧈" },
            { nombre: "Miel", cantidad: "30ml", icono: "🍯" }
        ],
        instrucciones: [
            "En un tazón, bate los huevos con la leche, azúcar, vainilla y canela",
            "Calienta una sartén con mantequilla a fuego medio",
            "Sumerge cada rebanada de pan en la mezcla de huevo por ambos lados",
            "Coloca en la sartén caliente",
            "Cocina 2-3 minutos hasta que se dore",
            "Voltea y cocina 2-3 minutos más del otro lado",
            "Sirve caliente con miel, fruta fresca o miel de maple"
        ],
        calificacion: 4.7,
        resenas: 127
    },
    {
        id: 13,
        nombre: "Muffins de arándanos",
        pais: "Estados Unidos",
        imagen: "🧁",
        tiempo: 45,
        categorias: ["desayunos", "postres", "baratas"],
        ingredientes: [
            { nombre: "Harina de trigo", cantidad: "250g", icono: "🌾" },
            { nombre: "Azúcar", cantidad: "100g", icono: "🍬" },
            { nombre: "Polvo para hornear", cantidad: "10g", icono: "⚪" },
            { nombre: "Sal", cantidad: "2g", icono: "🧂" },
            { nombre: "Huevos", cantidad: "2", icono: "🥚" },
            { nombre: "Leche", cantidad: "240ml", icono: "🥛" },
            { nombre: "Mantequilla derretida", cantidad: "60ml", icono: "🧈" },
            { nombre: "Arándanos frescos", cantidad: "200g", icono: "🫐" },
            { nombre: "Vainilla", cantidad: "5ml", icono: "🌸" }
        ],
        instrucciones: [
            "Precalienta el horno a 190°C",
            "Mezcla harina, azúcar, polvo para hornear y sal en un tazón",
            "En otro tazón, bate huevos con leche, mantequilla y vainilla",
            "Combina los ingredientes secos y líquidos",
            "Dobla suavemente los arándanos en la masa",
            "Llena los moldes de muffin 2/3 de su capacidad",
            "Hornea durante 25-30 minutos",
            "Deja enfriar 10 minutos antes de desmoldar"
        ],
        calificacion: 4.7,
        resenas: 119
    },
    {
        id: 14,
        nombre: "Banana bread",
        pais: "Estados Unidos",
        imagen: "🍌",
        tiempo: 60,
        categorias: ["desayunos", "postres", "baratas"],
        ingredientes: [
            { nombre: "Plátanos maduros", cantidad: "3", icono: "🍌" },
            { nombre: "Harina de trigo", cantidad: "250g", icono: "🌾" },
            { nombre: "Azúcar", cantidad: "150g", icono: "🍬" },
            { nombre: "Huevo", cantidad: "1", icono: "🥚" },
            { nombre: "Mantequilla derretida", cantidad: "80ml", icono: "🧈" },
            { nombre: "Polvo para hornear", cantidad: "5g", icono: "⚪" },
            { nombre: "Sal", cantidad: "2g", icono: "🧂" },
            { nombre: "Vainilla", cantidad: "5ml", icono: "🌸" },
            { nombre: "Nueces", cantidad: "100g", icono: "🌰" }
        ],
        instrucciones: [
            "Precalienta el horno a 175°C",
            "Machaca los plátanos en un tazón",
            "Mezcla mantequilla, azúcar y huevo",
            "Añade los plátanos machacados",
            "Agrega vainilla",
            "En otro tazón, mezcla harina, polvo para hornear y sal",
            "Combina los ingredientes secos y líquidos",
            "Dobla las nueces picadas",
            "Vierte en un molde engrasado",
            "Hornea 50-60 minutos hasta que un palillo salga limpio"
        ],
        calificacion: 4.6,
        resenas: 108
    },
    {
        id: 15,
        nombre: "Empanadas colombianas",
        pais: "Colombia",
        imagen: "🥟",
        tiempo: 45,
        categorias: ["desayunos", "comidas", "botanas", "entradas"],
        ingredientes: [
            { nombre: "Harina de trigo", cantidad: "300g", icono: "🌾" },
            { nombre: "Agua", cantidad: "150ml", icono: "💧" },
            { nombre: "Sal", cantidad: "3g", icono: "🧂" },
            { nombre: "Carne molida", cantidad: "200g", icono: "🥩" },
            { nombre: "Cebolla", cantidad: "1", icono: "🧅" },
            { nombre: "Papas cocidas", cantidad: "200g", icono: "🥔" },
            { nombre: "Huevo cocido", cantidad: "1", icono: "🥚" },
            { nombre: "Aceite", cantidad: "500ml", icono: "🛢️" }
        ],
        instrucciones: [
            "Mezcla harina con agua y sal para formar la masa",
            "Amasa hasta obtener consistencia suave",
            "Cubre y deja reposar 30 minutos",
            "Sofríe cebolla picada en aceite",
            "Agrega carne molida y cocina hasta que esté dorada",
            "Corta las papas cocidas en cubos",
            "Mezcla papas con la carne",
            "Parte la masa en bolitas",
            "Aplana cada bolita entre papel",
            "Coloca relleno en el centro",
            "Dobla la masa para formar un triángulo",
            "Cierra los bordes presionando con un tenedor",
            "Fríe en aceite caliente hasta que se doren"
        ],
        calificacion: 4.7,
        resenas: 134
    },
    {
        id: 16,
        nombre: "Pupusas salvadoreñas",
        pais: "El Salvador",
        imagen: "🥞",
        tiempo: 30,
        categorias: ["desayunos", "comidas", "botanas", "baratas"],
        ingredientes: [
            { nombre: "Masa de maíz", cantidad: "500g", icono: "🌾" },
            { nombre: "Agua", cantidad: "300ml", icono: "💧" },
            { nombre: "Queso Oaxaca", cantidad: "150g", icono: "🧀" },
            { nombre: "Frijoles refritos", cantidad: "200g", icono: "🫘" },
            { nombre: "Chicharrón", cantidad: "100g", icono: "🍖" },
            { nombre: "Cebolla", cantidad: "½", icono: "🧅" },
            { nombre: "Chile verde", cantidad: "1", icono: "🌶️" },
            { nombre: "Aceite", cantidad: "40ml", icono: "🛢️" }
        ],
        instrucciones: [
            "Mezcla masa de maíz con agua hasta obtener una masa suave",
            "Forma discos de masa en la palma de tu mano",
            "Coloca queso, frijoles y chicharrón en el centro",
            "Cierra la masa sobre el relleno",
            "Aplana suavemente el disco",
            "Calienta aceite en una sartén",
            "Fríe las pupusas 3-4 minutos por cada lado",
            "Sirve con salsa de tomate y curtido (ensalada de repollo)"
        ],
        calificacion: 4.8,
        resenas: 121
    },
    {
        id: 17,
        nombre: "Gallo pinto",
        pais: "Costa Rica",
        imagen: "🍚",
        tiempo: 25,
        categorias: ["desayunos", "comidas", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Arroz cocido", cantidad: "300g", icono: "🍚" },
            { nombre: "Frijoles cocidos", cantidad: "200g", icono: "🫘" },
            { nombre: "Cebolla", cantidad: "1", icono: "🧅" },
            { nombre: "Chile verde", cantidad: "1", icono: "🌶️" },
            { nombre: "Cilantro", cantidad: "10g", icono: "🌿" },
            { nombre: "Aceite", cantidad: "30ml", icono: "🛢️" },
            { nombre: "Sal", cantidad: "3g", icono: "🧂" },
            { nombre: "Pimienta", cantidad: "1g", icono: "🌶️" }
        ],
        instrucciones: [
            "Pica finamente la cebolla y el chile",
            "Calienta aceite en una sartén",
            "Sofríe cebolla y chile hasta que ablanden",
            "Agrega el arroz cocido",
            "Mezcla bien para separar los granos",
            "Agrega los frijoles cocidos",
            "Revuelve constantemente durante 5-7 minutos",
            "Sazona con sal y pimienta",
            "Decora con cilantro fresco",
            "Sirve caliente"
        ],
        calificacion: 4.6,
        resenas: 98
    },
    {
        id: 18,
        nombre: "Molletes mexicanos",
        pais: "México",
        imagen: "🍞",
        tiempo: 20,
        categorias: ["desayunos", "rapidas", "botanas"],
        ingredientes: [
            { nombre: "Bolillos o pan francés", cantidad: "4", icono: "🍞" },
            { nombre: "Frijoles refritos", cantidad: "200g", icono: "🫘" },
            { nombre: "Queso Oaxaca", cantidad: "150g", icono: "🧀" },
            { nombre: "Jamón", cantidad: "100g", icono: "🍖" },
            { nombre: "Tomate", cantidad: "2", icono: "🍅" },
            { nombre: "Cebolla", cantidad: "½", icono: "🧅" },
            { nombre: "Cilantro", cantidad: "10g", icono: "🌿" },
            { nombre: "Mantequilla", cantidad: "20g", icono: "🧈" }
        ],
        instrucciones: [
            "Precalienta el horno a 180°C",
            "Corta los bolillos por la mitad",
            "Unta frijoles refritos en cada mitad",
            "Coloca jamón sobre los frijoles",
            "Espolvora queso rallado",
            "Coloca en una bandeja",
            "Hornea 8-10 minutos hasta que el queso se derrita",
            "Decora con tomate, cebolla y cilantro fresco",
            "Sirve caliente"
        ],
        calificacion: 4.5,
        resenas: 87
    },
    {
        id: 19,
        nombre: "Scones ingleses",
        pais: "Reino Unido",
        imagen: "🧁",
        tiempo: 30,
        categorias: ["desayunos", "postres"],
        ingredientes: [
            { nombre: "Harina de trigo", cantidad: "250g", icono: "🌾" },
            { nombre: "Polvo para hornear", cantidad: "10g", icono: "⚪" },
            { nombre: "Azúcar", cantidad: "40g", icono: "🍬" },
            { nombre: "Sal", cantidad: "2g", icono: "🧂" },
            { nombre: "Mantequilla fría", cantidad: "100g", icono: "🧈" },
            { nombre: "Leche", cantidad: "120ml", icono: "🥛" },
            { nombre: "Huevo", cantidad: "1", icono: "🥚" },
            { nombre: "Mermelada", cantidad: "100g", icono: "🫙" },
            { nombre: "Nata", cantidad: "100ml", icono: "🥛" }
        ],
        instrucciones: [
            "Precalienta el horno a 200°C",
            "Mezcla harina, polvo para hornear, azúcar y sal",
            "Corta la mantequilla fría en cubos y añade a la mezcla",
            "Frota con los dedos hasta obtener migas",
            "Vierte leche poco a poco hasta formar una masa",
            "Sobre una superficie enharinada, aplana la masa a 2cm de grosor",
            "Corta con un cortador redondo",
            "Coloca en una bandeja",
            "Barniza con huevo batido",
            "Hornea 12-15 minutos hasta dorar",
            "Sirve tibio con mermelada y nata"
        ],
        calificacion: 4.8,
        resenas: 142
    },
    {
        id: 20,
        nombre: "Pain au chocolat",
        pais: "Francia",
        imagen: "🍫",
        tiempo: 240,
        categorias: ["desayunos", "postres"],
        ingredientes: [
            { nombre: "Masa de hojaldre", cantidad: "500g", icono: "🥐" },
            { nombre: "Chocolate oscuro", cantidad: "200g", icono: "🍫" },
            { nombre: "Mantequilla", cantidad: "50g", icono: "🧈" },
            { nombre: "Azúcar", cantidad: "30g", icono: "🍬" },
            { nombre: "Huevo", cantidad: "1", icono: "🥚" }
        ],
        instrucciones: [
            "Prepara la masa de hojaldre (o usa masa congelada)",
            "Estira la masa en un rectángulo",
            "Corta en rectángulos medianos",
            "Coloca 2-3 trozos de chocolate en el centro de cada rectángulo",
            "Dobla la masa sobre el chocolate",
            "Presiona los bordes para sellar",
            "Coloca en una bandeja",
            "Deja reposar 30 minutos",
            "Barniza con huevo batido",
            "Hornea a 200°C durante 20-25 minutos",
            "Sirve caliente"
        ],
        calificacion: 4.9,
        resenas: 167
    },
    {
        id: 21,
        nombre: "Tacos al pastor",
        pais: "México",
        imagen: "🌮",
        tiempo: 35,
        categorias: ["comidas", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Carne de cerdo", cantidad: "600g", icono: "🥩" },
            { nombre: "Piña", cantidad: "½ pieza", icono: "🍍" },
            { nombre: "Cebolla", cantidad: "3 piezas", icono: "🧅" },
            { nombre: "Cilantro", cantidad: "al gusto", icono: "🌿" },
            { nombre: "Limón", cantidad: "2", icono: "🍋" },
            { nombre: "Tortillas de maíz", cantidad: "12", icono: "🌮" },
            { nombre: "Achiote", cantidad: "3 cucharadas", icono: "🌶️" }
        ],
        instrucciones: [
            "Marina la carne en achiote, vinagre, sal y especias",
            "Cocina la carne marinada en una sartén caliente",
            "Coloca piña en los últimos minutos de cocción",
            "Calienta las tortillas",
            "Coloca la carne en las tortillas",
            "Decora con cebolla picada, cilantro y limón"
        ],
        calificacion: 4.8,
        resenas: 289
    },
    {
        id: 22,
        nombre: "Spaghetti Carbonara",
        pais: "Italia",
        imagen: "🍝",
        tiempo: 20,
        categorias: ["comidas", "rapidas"],
        ingredientes: [
            { nombre: "Espagueti", cantidad: "400g", icono: "🍝" },
            { nombre: "Guanciale o Panceta", cantidad: "150g", icono: "🥓" },
            { nombre: "Huevo", cantidad: "4", icono: "🥚" },
            { nombre: "Queso Pecorino", cantidad: "100g", icono: "🧀" },
            { nombre: "Pimienta negra", cantidad: "al gusto", icono: "⚫" },
            { nombre: "Sal", cantidad: "al gusto", icono: "🧂" }
        ],
        instrucciones: [
            "Cocina el espagueti según las instrucciones",
            "Fríe el guanciale hasta que esté crujiente",
            "Bate los huevos con queso y pimienta",
            "Escurre la pasta dejando agua de cocción",
            "Mezcla pasta caliente con el guanciale",
            "Retira del fuego y agrega la mezcla de huevo",
            "Revuelve constantemente para crear salsa cremosa"
        ],
        calificacion: 4.7,
        resenas: 234
    },
    {
        id: 23,
        nombre: "Arroz con pollo",
        pais: "Varios países latinoamericanos",
        imagen: "🍚",
        tiempo: 45,
        categorias: ["comidas", "baratas"],
        ingredientes: [
            { nombre: "Arroz blanco", cantidad: "300g", icono: "🍚" },
            { nombre: "Pollo", cantidad: "800g", icono: "🍗" },
            { nombre: "Caldo de pollo", cantidad: "750ml", icono: "🥣" },
            { nombre: "Cebolla", cantidad: "2 piezas", icono: "🧅" },
            { nombre: "Ajo", cantidad: "4 dientes", icono: "🧄" },
            { nombre: "Ají o chile", cantidad: "2", icono: "🌶️" },
            { nombre: "Guisantes", cantidad: "100g", icono: "🟢" },
            { nombre: "Zanahorias", cantidad: "200g", icono: "🥕" },
            { nombre: "Aceite", cantidad: "3 cucharadas", icono: "🫒" }
        ],
        instrucciones: [
            "Sofríe cebolla, ajo y ají picados",
            "Agrega el pollo en trozos y cocina hasta sellar",
            "Agrega el arroz y revuelve 2 minutos",
            "Vierte el caldo caliente",
            "Tapa y cocina 20-25 minutos",
            "Agrega verduras en los últimos 10 minutos"
        ],
        calificacion: 4.5,
        resenas: 198
    },
    {
        id: 24,
        nombre: "Tiramisu",
        pais: "Italia",
        imagen: "🍰",
        tiempo: 30,
        categorias: ["postres"],
        ingredientes: [
            { nombre: "Queso mascarpone", cantidad: "500g", icono: "🧀" },
            { nombre: "Huevo", cantidad: "4", icono: "🥚" },
            { nombre: "Azúcar", cantidad: "150g", icono: "🍯" },
            { nombre: "Café espresso", cantidad: "300ml", icono: "☕" },
            { nombre: "Cacao en polvo", cantidad: "50g", icono: "🌰" },
            { nombre: "Galletas savoiardi", cantidad: "400g", icono: "🍪" }
        ],
        instrucciones: [
            "Bate yemas con azúcar hasta obtener mezcla pálida",
            "Agrega mascarpone y bate suavemente",
            "Incorpora claras a punto de nieve",
            "Sumerge galletas en café",
            "Alterna capas de galletas y crema",
            "Refrigera 4 horas",
            "Espolvorea cacao antes de servir"
        ],
        calificacion: 4.8,
        resenas: 267
    },
    {
        id: 25,
        nombre: "Brownies de chocolate",
        pais: "Estados Unidos",
        imagen: "🍫",
        tiempo: 40,
        categorias: ["postres", "baratas"],
        ingredientes: [
            { nombre: "Chocolate oscuro", cantidad: "200g", icono: "🍫" },
            { nombre: "Mantequilla", cantidad: "150g", icono: "🧈" },
            { nombre: "Huevo", cantidad: "3", icono: "🥚" },
            { nombre: "Azúcar morena", cantidad: "200g", icono: "🍯" },
            { nombre: "Harina", cantidad: "100g", icono: "🌾" },
            { nombre: "Cacao en polvo", cantidad: "50g", icono: "🌰" },
            { nombre: "Polvo de hornear", cantidad: "1 cucharadita", icono: "💨" }
        ],
        instrucciones: [
            "Precalienta horno a 180°C",
            "Funde chocolate con mantequilla",
            "Bate huevos con azúcar",
            "Combina mezclas",
            "Agrega ingredientes secos",
            "Hornea 25-30 minutos",
            "Deja enfriar antes de cortar"
        ],
        calificacion: 4.9,
        resenas: 312
    },
    {
        id: 26,
        nombre: "Margarita",
        pais: "México",
        imagen: "🍹",
        tiempo: 5,
        categorias: ["bebidas", "rapidas"],
        ingredientes: [
            { nombre: "Tequila blanco", cantidad: "60ml", icono: "🥃" },
            { nombre: "Licor de naranja", cantidad: "30ml", icono: "🍊" },
            { nombre: "Jugo de limón", cantidad: "30ml", icono: "🍋" },
            { nombre: "Hielo", cantidad: "abundante", icono: "🧊" },
            { nombre: "Sal", cantidad: "para el borde", icono: "🧂" }
        ],
        instrucciones: [
            "Pasa limón por el borde de la copa",
            "Presiona el borde en sal",
            "Llena de hielo",
            "Vierte tequila, licor y jugo de limón",
            "Agita vigorosamente",
            "Vierte en la copa",
            "Decora con rodaja de limón"
        ],
        calificacion: 4.7,
        resenas: 178
    },
    {
        id: 27,
        nombre: "Café con leche",
        pais: "Varios países",
        imagen: "☕",
        tiempo: 10,
        categorias: ["bebidas", "rapidas", "baratas"],
        ingredientes: [
            { nombre: "Café molido", cantidad: "15g", icono: "☕" },
            { nombre: "Agua caliente", cantidad: "150ml", icono: "💧" },
            { nombre: "Leche", cantidad: "150ml", icono: "🥛" },
            { nombre: "Azúcar", cantidad: "al gusto", icono: "🍯" }
        ],
        instrucciones: [
            "Calienta agua a 90-95°C",
            "Prepara el café",
            "Calienta la leche",
            "Vierte café en taza",
            "Agrega leche caliente",
            "Añade azúcar si deseas",
            "Revuelve bien"
        ],
        calificacion: 4.6,
        resenas: 245
    },
    {
        id: 28,
        nombre: "Tabla de quesos y embutidos",
        pais: "Europa",
        imagen: "🧀",
        tiempo: 15,
        categorias: ["entradas", "baratas"],
        ingredientes: [
            { nombre: "Queso brie", cantidad: "200g", icono: "🧀" },
            { nombre: "Queso cheddar", cantidad: "200g", icono: "🧀" },
            { nombre: "Jamón serrano", cantidad: "150g", icono: "🥓" },
            { nombre: "Salami", cantidad: "150g", icono: "🥓" },
            { nombre: "Olivas", cantidad: "100g", icono: "🫒" },
            { nombre: "Frutos secos", cantidad: "100g", icono: "🥜" },
            { nombre: "Pan tostado", cantidad: "200g", icono: "🥖" },
            { nombre: "Frutas frescas", cantidad: "variedad", icono: "🍇" }
        ],
        instrucciones: [
            "Saca los quesos 15-20 minutos antes",
            "Corta los quesos en porciones",
            "Coloca jamones en círculos",
            "Distribuye quesos alrededor",
            "Agrega aceitunas",
            "Añade frutos secos",
            "Coloca frutas frescas cortadas",
            "Acomoda el pan",
            "Sirve con mermeladas"
        ],
        calificacion: 4.7,
        resenas: 156
    },
    {
        id: 29,
        nombre: "Quesadilla de queso",
        pais: "México",
        imagen: "🧀",
        tiempo: 10,
        categorias: ["rapidas", "baratas", "comidas"],
        ingredientes: [
            { nombre: "Tortillas de harina", cantidad: "4", icono: "🫔" },
            { nombre: "Queso Oaxaca", cantidad: "200g", icono: "🧀" },
            { nombre: "Cebolla", cantidad: "½ pieza", icono: "🧅" },
            { nombre: "Cilantro", cantidad: "al gusto", icono: "🌿" },
            { nombre: "Salsa", cantidad: "al gusto", icono: "🌶️" },
            { nombre: "Aceite", cantidad: "2 cucharadas", icono: "🫒" }
        ],
        instrucciones: [
            "Calienta sartén a fuego medio-alto",
            "Coloca una tortilla",
            "Agrega queso sobre la mitad",
            "Añade cebolla y cilantro",
            "Dobla la tortilla",
            "Cocina 2-3 minutos por lado",
            "Sirve inmediatamente con salsa"
        ],
        calificacion: 4.5,
        resenas: 134
    },
    {
        id: 30,
        nombre: "Enchiladas verdes",
        pais: "México",
        imagen: "🌶️",
        tiempo: 35,
        categorias: ["comidas", "baratas"],
        ingredientes: [
            { nombre: "Tortillas de maíz", cantidad: "8", icono: "🌮" },
            { nombre: "Salsa verde", cantidad: "300ml", icono: "🟢" },
            { nombre: "Queso fresco", cantidad: "150g", icono: "🧀" },
            { nombre: "Pollo deshebrado", cantidad: "200g", icono: "🍗" },
            { nombre: "Cebolla", cantidad: "1", icono: "🧅" },
            { nombre: "Crema", cantidad: "100ml", icono: "🥛" },
            { nombre: "Aceite", cantidad: "40ml", icono: "🫒" }
        ],
        instrucciones: [
            "Calienta aceite en sartén",
            "Sumerge tortillas en salsa",
            "Coloca pollo y queso en cada tortilla",
            "Enrolla y coloca en refractario",
            "Vierte salsa restante",
            "Hornea a 180°C 15 minutos",
            "Decora con crema y queso fresco"
        ],
        calificacion: 4.6,
        resenas: 167
    },
    {
        id: 31,
        nombre: "Mote de queso",
        pais: "Colombia",
        imagen: "🍲",
        tiempo: 40,
        categorias: ["comidas", "desayunos", "baratas"],
        ingredientes: [
            { nombre: "Maíz blanco", cantidad: "300g", icono: "🌽" },
            { nombre: "Queso fresco", cantidad: "200g", icono: "🧀" },
            { nombre: "Cebolla", cantidad: "1", icono: "🧅" },
            { nombre: "Ajo", cantidad: "3 dientes", icono: "🧄" },
            { nombre: "Caldo de pollo", cantidad: "1 litro", icono: "🥣" },
            { nombre: "Cilantro", cantidad: "al gusto", icono: "🌿" },
            { nombre: "Aceite", cantidad: "30ml", icono: "🫒" }
        ],
        instrucciones: [
            "Cocina el maíz blanco hasta que esté suave",
            "Sofríe cebolla y ajo",
            "Agrega el maíz cocido",
            "Vierte el caldo",
            "Cocina 20 minutos",
            "Agrega queso fresco en cubos",
            "Decora con cilantro",
            "Sirve caliente"
        ],
        calificacion: 4.5,
        resenas: 98
    },
    {
        id: 32,
        nombre: "Onigiri",
        pais: "Japón",
        imagen: "🍙",
        tiempo: 20,
        categorias: ["rapidas", "baratas", "comidas"],
        ingredientes: [
            { nombre: "Arroz cocido", cantidad: "300g", icono: "🍚" },
            { nombre: "Nori (alga)", cantidad: "2 láminas", icono: "🪴" },
            { nombre: "Atún enlatado", cantidad: "100g", icono: "🐟" },
            { nombre: "Mayonesa", cantidad: "30g", icono: "🥄" },
            { nombre: "Sal", cantidad: "2g", icono: "🧂" },
            { nombre: "Agua", cantidad: "100ml", icono: "💧" }
        ],
        instrucciones: [
            "Mezcla atún con mayonesa",
            "Humedece tus manos con agua salada",
            "Coloca arroz en la palma",
            "Haz un hueco en el centro",
            "Coloca relleno de atún",
            "Cubre con más arroz",
            "Molde con las manos en forma triangular",
            "Envuelve con tira de nori",
            "Sirve fresco o a temperatura ambiente"
        ],
        calificacion: 4.4,
        resenas: 112
    },
    {
        id: 33,
        nombre: "Dim sum",
        pais: "China",
        imagen: "🥟",
        tiempo: 40,
        categorias: ["comidas", "entradas"],
        ingredientes: [
            { nombre: "Masa para wonton", cantidad: "24 cuadrados", icono: "🫔" },
            { nombre: "Camarón", cantidad: "150g", icono: "🦐" },
            { nombre: "Cerdo molido", cantidad: "100g", icono: "🥩" },
            { nombre: "Cebolleta", cantidad: "2", icono: "🌿" },
            { nombre: "Jengibre", cantidad: "10g", icono: "🟤" },
            { nombre: "Salsa de soya", cantidad: "30ml", icono: "🍲" },
            { nombre: "Agua", cantidad: "500ml", icono: "💧" }
        ],
        instrucciones: [
            "Mezcla camarón picado con cerdo y vegetales",
            "Coloca relleno en el centro de cada cuadrado de masa",
            "Dobla y sella los bordes",
            "Hierve agua en una olla",
            "Coloca dim sum en una vaporera",
            "Cocina al vapor 10-12 minutos",
            "Sirve caliente con salsa de soya"
        ],
        calificacion: 4.6,
        resenas: 145
    },
    {
        id: 34,
        nombre: "Dosa india",
        pais: "India",
        imagen: "🫔",
        tiempo: 15,
        categorias: ["desayunos", "comidas", "rapidas"],
        ingredientes: [
            { nombre: "Masa de dosa", cantidad: "250g", icono: "🌾" },
            { nombre: "Papa", cantidad: "2", icono: "🥔" },
            { nombre: "Cebolla", cantidad: "1", icono: "🧅" },
            { nombre: "Chile verde", cantidad: "2", icono: "🌶️" },
            { nombre: "Cilantro", cantidad: "al gusto", icono: "🌿" },
            { nombre: "Cúrcuma", cantidad: "2g", icono: "🟡" },
            { nombre: "Aceite", cantidad: "40ml", icono: "🫒" }
        ],
        instrucciones: [
            "Cocina papas y aplasta ligeramente",
            "Sofríe cebolla, chile y cilantro",
            "Mezcla con papas y cúrcuma",
            "Calienta sartén con aceite",
            "Vierte masa de dosa y extiende",
            "Cocina hasta que esté crujiente",
            "Voltea si deseas",
            "Rellena con mezcla de papa",
            "Dobla y sirve con chutney"
        ],
        calificacion: 4.5,
        resenas: 98
    },
    {
        id: 35,
        nombre: "Choripán argentino",
        pais: "Argentina",
        imagen: "🌭",
        tiempo: 15,
        categorias: ["rapidas", "comidas", "baratas"],
        ingredientes: [
            { nombre: "Chorizo", cantidad: "4", icono: "🥓" },
            { nombre: "Pan de panadería", cantidad: "4 piezas", icono: "🥖" },
            { nombre: "Chimichurri", cantidad: "100ml", icono: "🌿" },
            { nombre: "Cebolla roja", cantidad: "1", icono: "🧅" },
            { nombre: "Tomate", cantidad: "1", icono: "🍅" },
            { nombre: "Lechuga", cantidad: "al gusto", icono: "🥬" }
        ],
        instrucciones: [
            "Asa los chorizos a la parrilla o sartén",
            "Calienta el pan",
            "Prepara chimichurri (perejil, ajo, vinagre y aceite)",
            "Coloca chorizo en el pan",
            "Vierte chimichurri generosamente",
            "Agrega cebolla roja picada",
            "Añade tomate y lechuga",
            "Sirve inmediatamente"
        ],
        calificacion: 4.6,
        resenas: 134
    }
];

// Función para obtener iconos de ingredientes automáticamente
function getIngredientIcon(ingredientName) {
    const iconMap = {
        "harina": "🌾",
        "azúcar": "🍬",
        "sal": "🧂",
        "huevo": "🥚",
        "mantequilla": "🧈",
        "leche": "🥛",
        "queso": "🧀",
        "carne": "🥩",
        "pollo": "🍗",
        "pescado": "🐟",
        "tomate": "🍅",
        "cebolla": "🧅",
        "ajo": "🧄",
        "papa": "🥔",
        "arroz": "🍚",
        "frijoles": "🫘",
        "cilantro": "🌿",
        "chile": "🌶️",
        "limón": "🍋",
        "aguacate": "🥑",
        "plátano": "🍌",
        "fresas": "🍓",
        "arándanos": "🫐",
        "agua": "💧",
        "aceite": "🛢️",
        "vinagre": "🫙",
        "miel": "🍯",
        "canela": "🥄",
        "vainilla": "🌸",
        "chocolate": "🍫",
        "café": "☕",
        "té": "🫖",
        "almendras": "🌰",
        "nueces": "🌰",
        "coco": "🥥",
        "granola": "🌾",
        "yogurt": "🥛",
        "pan": "🍞",
        "tortilla": "🌮"
    };

    for (let [key, icon] of Object.entries(iconMap)) {
        if (ingredientName.toLowerCase().includes(key)) {
            return icon;
        }
    }
    return "🍽️";
}
