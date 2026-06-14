-- Nettoyage des données de test (cascade sur profiles, programs, program_points, duels)
delete from auth.users where email like '%@seed.test';

do $$
declare
  uid uuid;
  prog_id uuid;
  usernames  text[]  := array[
    'Marie_Leblanc','Thomas_Martin','Sophie_Durand','Lucas_Bernard','Emma_Petit',
    'Hugo_Robert','Lea_Simon','Noah_Michel','Chloe_Leroy','Antoine_Moreau',
    'Julien_Faure','Camille_Blanc','Romain_Girard','Inès_Rousseau','Maxime_Garnier',
    'Laura_Fontaine','Alexis_Renard','Manon_Chevalier','Baptiste_Morin','Clara_Vidal',
    'Nicolas_Lemaire','Pauline_Gaudin','Théo_Barbier','Alice_Perrin','Quentin_Dupuy',
    'Zoé_Marchand','Florian_Bonnet','Ambre_Jacquet','Kevin_Arnaud','Charlotte_Michaud',
    'Ethan_Caron','Elisa_Gilles','Raphael_Bouchard','Jade_Guerin','Pierre_Delorme',
    'Lucie_Maillard','Samuel_Laporte','Noémie_Aubert','Tristan_Collet','Victoria_Huet'
  ];
  slogans    text[]  := array[
    'Pour une France solidaire','L''avenir appartient à ceux qui agissent',
    'Ensemble construisons demain','La France mérite mieux','Agir pour les citoyens',
    'Un nouveau souffle pour la République','La force du peuple','Innover pour progresser',
    'La justice avant tout','Pour un monde meilleur',
    'La France en tête','Liberté, mérite, progrès',
    'Réconcilier les Français','Plus fort ensemble','Le courage de changer',
    'La France qui travaille','Construire l''avenir','Pour nos enfants',
    'L''écologie c''est maintenant','Réinventer la politique',
    'Souveraineté et fierté','L''ordre et la prospérité',
    'Tous égaux, tous libres','La France des terroirs','Vive la République !',
    'Pour une France juste','Ambition France','Demain se prépare aujourd''hui',
    'La France du bon sens','Engagement et vérité',
    'Redonner le pouvoir aux citoyens','La France en mouvement',
    'Changer sans trahir','France d''abord, France pour tous','L''espoir est un choix',
    'Gouverner autrement','La République, c''est nous','Vers une France apaisée',
    'Le peuple avant les élites','Construire, rassembler, réussir'
  ];
  colors     text[]  := array[
    '#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c',
    '#3498db','#9b59b6','#e91e63','#e74c3c','#3498db',
    '#e74c3c','#3498db','#27ae60','#8e44ad','#e67e22',
    '#16a085','#2980b9','#c0392b','#27ae60','#f39c12',
    '#7f8c8d','#2c3e50','#e74c3c','#27ae60','#3498db',
    '#9b59b6','#e67e22','#1abc9c','#e91e63','#2ecc71',
    '#3498db','#e74c3c','#f1c40f','#8e44ad','#16a085',
    '#c0392b','#2980b9','#e67e22','#27ae60','#9b59b6'
  ];
  elos       integer[] := array[
    980, 1060, 1210, 1340, 1090, 1520, 1150, 870, 1420, 1310,
    1005, 1175, 1390, 930, 1260, 1480, 1070, 1320, 990, 1440,
    1110, 860, 1550, 1030, 1280, 1120, 940, 1370, 1200, 1490,
    1080, 1350, 920, 1160, 1420, 970, 1300, 1050, 1230, 1380
  ];

  titles text[][] := array[
    -- 1 Marie_Leblanc
    array['Augmenter le SMIC de 15%','Classes de 20 élèves max','Zéro pesticide d''ici 2030','Remboursement intégral des soins','10 000 policiers supplémentaires','Semaine de 4 jours'],
    -- 2 Thomas_Martin
    array['Taxer les superprofits','École obligatoire dès 2 ans','Isolation de tous les logements','Déserts médicaux : médecins salariés','Caméras dans tous les quartiers','Légaliser le cannabis'],
    -- 3 Sophie_Durand
    array['Revenu universel à 800€','Université gratuite pour tous','Mer propre en 10 ans','Hôpitaux publics renforcés','Peines planchers pour récidivistes','Mariage pour tous renforcé'],
    -- 4 Lucas_Bernard
    array['Flat tax à 15%','Apprentissage dès le collège','Nucléaire : 20 nouveaux réacteurs','Médecin traitant remboursé à 100%','Police de proximité relancée','Retraite à 60 ans'],
    -- 5 Emma_Petit
    array['Fin des paradis fiscaux','Bac professionnel revalorisé','Forêts : 1 milliard d''arbres','Santé mentale remboursée','Réforme de la justice pénale','Droit à mourir dans la dignité'],
    -- 6 Hugo_Robert
    array['Plan de relance industriel','Cantines 100% bio','Transport gratuit dans les villes','Plan grand âge : 50 000 soignants','Doublement du budget défense','Congé parental égalitaire'],
    -- 7 Lea_Simon
    array['Salaire maximum 20x le SMIC','Réforme du brevet','Interdire les SUV en ville','Prévention avant tout','Justice restaurative développée','Logement : encadrement des loyers'],
    -- 8 Noah_Michel
    array['Nationaliser EDF','Plus de profs de sport','Taxe carbone progressive','Médecine préventive obligatoire','Expulsion facilitée','Vote obligatoire'],
    -- 9 Chloe_Leroy
    array['Réduire la dette en 5 ans','École numérique pour tous','Fin du plastique jetable','Généraliste en 48h garanti','Bracelet électronique généralisé','Intégration renforcée'],
    -- 10 Antoine_Moreau
    array['Protectionnisme européen','Langue des signes au primaire','Agriculture locale prioritaire','CHU dans chaque département','Peine de mort débattue','Référendum d''initiative citoyenne'],
    -- 11 Julien_Faure
    array['Baisser l''impôt sur les sociétés','Alternance dès la 3ème','Relancer le nucléaire civil','Fin des déserts médicaux en 5 ans','Renforcer Frontex','Retraite à 64 ans maintenue'],
    -- 12 Camille_Blanc
    array['ISF climatique sur les grandes fortunes','Zéro frais d''inscription à l''université','100% énergies renouvelables en 2040','Hôpital public comme priorité nationale','Police : formation aux droits civiques','PMA pour toutes'],
    -- 13 Romain_Girard
    array['Fusion IR et CSG','Apprentissage du code dès le CP','Taxe sur les vols court-courriers','Ticket modérateur supprimé','Légion étrangère doublée','Référendum constituant'],
    -- 14 Inès_Rousseau
    array['Salaire minimum à 1 600€ net','Mixité scolaire obligatoire','Végétalisation des villes','Remboursement des lunettes à 100%','Caméras piétons pour tous les policiers','Retraite à 60 ans pour les métiers pénibles'],
    -- 15 Maxime_Garnier
    array['Supprimer l''ENA','Classes prépa ouvertes à tous','Reforestation nationale','Sécurité sociale intégrale','Tolérance zéro pour la récidive','Proportionnelle aux législatives'],
    -- 16 Laura_Fontaine
    array['Dividende universel de 500€','École de la confiance','Zéro déchet d''ici 2035','Médecin coordinateur de santé','Service national universel renforcé','Légalisation du cannabis thérapeutique'],
    -- 17 Alexis_Renard
    array['TVA réduite sur les produits essentiels','Carte scolaire supprimée','Voiture électrique pour tous d''ici 2030','Médecine du travail renforcée','Réforme du code pénal','Euthanasie légalisée sous conditions'],
    -- 18 Manon_Chevalier
    array['Banque publique d''investissement','Enseignants mieux payés','Retraite à taux plein à 60 ans','Hôpital de proximité dans chaque canton','Interdiction des armes de guerre en civil','Droit de vote à 16 ans'],
    -- 19 Baptiste_Morin
    array['Réindustrialiser la France','Bac +3 gratuit pour tous','Objectif neutralité carbone 2045','Remboursement dentaire intégral','Renforcement des frontières','Modèle suisse : démocratie directe'],
    -- 20 Clara_Vidal
    array['Impôt sur la fortune rétabli','École inclusive renforcée','Sortie du nucléaire progressive','Médecins salariés en zones rurales','Fin de la double peine','Retraite à 60 ans pour tous'],
    -- 21 Nicolas_Lemaire
    array['Flat tax à 20% unique','Liberté de l''enseignement','Énergie nucléaire prolongée','Médecin de famille pour chaque Français','Peine plancher pour violence sur agents','Référendum sur l''immigration'],
    -- 22 Pauline_Gaudin
    array['Coopératives soutenues par l''État','Abécédaire de l''écologie à l''école','Sobriété énergétique nationale','Remboursement à 100% des prothèses auditives','Désarmement progressif de la police','Droit à l''avortement constitutionnalisé'],
    -- 23 Théo_Barbier
    array['Suppression de l''IS pour les PME','Autonomie des établissements scolaires','Hydroélectricité maximisée','Sécu santé pour les auto-entrepreneurs','Peines de prison ferme pour trafiquants','Loi référendaire annuelle'],
    -- 24 Alice_Perrin
    array['Allocation universelle d''autonomie','Recrutement 10 000 profs supplémentaires','Biodiversité : zones protégées doublées','Un psychiatre pour 1 000 habitants','Corps de sécurité civile','Maisons de naissance remboursées'],
    -- 25 Quentin_Dupuy
    array['Taxer les transactions financières','Bourse au mérite généralisée','Plan vélo national','Remboursement des médecines douces','Réduire le temps de garde à vue','Constituante citoyenne'],
    -- 26 Zoé_Marchand
    array['Revenu de base expérimental','Enseignement des langues régionales','Éolien offshore massif','Prévention santé dès l''école','Interdiction des armes à feu en civil','Vote blanc comptabilisé'],
    -- 27 Florian_Bonnet
    array['Privatisation des autoroutes inversée','Examen national d''entrée en lycée','Subventions aux agriculteurs bio','Ticket repas médical','Surveillance vidéo dans les prisons','Service militaire obligatoire'],
    -- 28 Ambre_Jacquet
    array['Conditionnalité des aides aux entreprises','Lutte contre le harcèlement scolaire','Loi littoral étendue à toute la France','Prise en charge psychologique gratuite','Réforme des gardes à vue','Parité obligatoire dans les entreprises'],
    -- 29 Kevin_Arnaud
    array['Zone franche dans les QPV','Réseau Grande Vitesse étendu','Eau : bien commun constitutionnel','Hôpital psychiatrique renforcé','Police de quartier obligatoire','Quotas d''immigration annuels votés'],
    -- 30 Charlotte_Michaud
    array['Salaire des enseignants revalorisé de 20%','Numérique éthique à l''école','Transition agricole aidée','100% dépistage cancer remboursé','Justice des mineurs renforcée','Congé menstruel légal'],
    -- 31 Ethan_Caron
    array['Déficit zéro en 10 ans','Classes bilangues dès le CP','Parc nucléaire modernisé','Fin de la carte Vitale papier','Gendarmerie en zone rurale renforcée','Retraite progressive dès 55 ans'],
    -- 32 Elisa_Gilles
    array['Revenu minimum garanti à 900€','Mixité sociale dans les grandes écoles','Espaces naturels protégés à 30%','IVG intégralement remboursée','Contrôle indépendant de la police','Semaine de 32 heures sans perte de salaire'],
    -- 33 Raphael_Bouchard
    array['Réduction des dépenses publiques de 10%','Baccalauréat professionnel revalorisé','Énergie nucléaire comme pivot','Télémédecine généralisée','Retour à la double peine pour trafiquants','Maîtrise des flux migratoires'],
    -- 34 Jade_Guerin
    array['Banque postale renforcée','École bilingue pour tous','Rivières restaurées : plan national','Désert médical : maisons pluridisciplinaires','Réforme du maintien de l''ordre','Congé second parent porté à 8 semaines'],
    -- 35 Pierre_Delorme
    array['Suppression des 35 heures','Lycée professionnel valorisé','Énergie : mix souverain','Médecin référent remboursé à 100%','Contrôle aux frontières rétabli','Retraite à points'],
    -- 36 Lucie_Maillard
    array['Gratuité des transports pour les moins de 26 ans','Brevet des collèges rénové','Sobriété foncière obligatoire','Remboursement orthodontie adulte','Désarmement de certaines unités de police','Droit de grève constitutionnalisé'],
    -- 37 Samuel_Laporte
    array['Investissement public massif','Éducation civique renforcée','Mer : patrouilles antipollution','1 médecin pour 800 habitants','Renseignement territorial renforcé','Retraite à 60 ans pour métiers pénibles'],
    -- 38 Noémie_Aubert
    array['Impôt progressif renforcé','Scolarisation dès 2 ans universelle','Train moins cher que l''avion','Sécu dentaire pour tous','Cellules antigang dans chaque préfecture','Droit à l''oubli numérique'],
    -- 39 Tristan_Collet
    array['Exonération de charges pour TPE','Filières d''excellence décentralisées','Cap carbone par secteur','Remboursement kiné à 100%','Interdiction des drogues de synthèse dure','Référendum révocatoire des élus'],
    -- 40 Victoria_Huet
    array['Minimum vieillesse à 1 200€','Jeux olympiques : héritage scolaire','Plan eau potable pour tous','Maternités de proximité sauvegardées','Police : corps d''inspection indépendant','Durée du travail négociée par branche']
  ];
  i integer;
  j integer;
begin
  for i in 1..40 loop
    uid := gen_random_uuid();

    insert into auth.users (
      id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      aud, role
    ) values (
      uid,
      lower(replace(usernames[i], '_', '.')) || i || '@seed.test',
      '$2a$10$PgjZGnFkBHHqFfCQFVuFGePMLjAKjV7NLVW2e5jBDpJGEInMQjpnG', -- password: test1234
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      'authenticated', 'authenticated'
    );

    update profiles set
      username       = usernames[i],
      slogan         = slogans[i],
      avatar_url     = colors[i],
      elo            = elos[i],
      setup_complete = true
    where id = uid;

    insert into programs (user_id, status)
    values (uid, 'approved')
    returning id into prog_id;

    for j in 1..6 loop
      insert into program_points (program_id, "order", category, title)
      values (
        prog_id, j,
        (array['Économie','Éducation','Environnement','Santé','Sécurité','Société'])[j],
        titles[i][j]
      );
    end loop;

  end loop;
end;
$$;
