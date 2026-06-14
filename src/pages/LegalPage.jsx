import { useParams, useNavigate } from 'react-router-dom'

const SECTIONS = {
  mentions: {
    title: 'Mentions légales',
    content: (
      <>
        <h2>Éditeur du site</h2>
        <p>Le site <strong>Mon Programme Politique</strong> est édité à titre personnel et non commercial.</p>
        <p>Responsable de publication : <strong>Wappydev</strong><br />
        Contact : <strong>wappydeveloppement@gmail.com</strong></p>

        <h2>Hébergement</h2>
        <p>Le site est hébergé par :<br />
        <strong>Vercel Inc.</strong> – 340 Pine Street, Suite 701, San Francisco, CA 94104, USA<br />
        La base de données est hébergée par <strong>Supabase Inc.</strong> sur des serveurs situés dans l'Union européenne (région eu-west).</p>

        <h2>Propriété intellectuelle</h2>
        <p>L'ensemble du contenu du site (code, design, textes) est la propriété de l'éditeur, sauf les programmes politiques rédigés par les utilisateurs qui leur appartiennent.</p>

        <h2>Limitation de responsabilité</h2>
        <p>L'éditeur ne saurait être tenu responsable du contenu des programmes publiés par les utilisateurs. Tout contenu illicite peut être signalé via le panel de modération.</p>

        <h2>Droit applicable</h2>
        <p>Le présent site est soumis au droit français. Tout litige relève de la compétence des tribunaux français.</p>
      </>
    ),
  },

  confidentialite: {
    title: 'Politique de confidentialité',
    content: (
      <>
        <h2>Responsable du traitement</h2>
        <p><strong>Wappydev</strong> – <strong>wappydeveloppement@gmail.com</strong></p>

        <h2>Données collectées</h2>
        <p>Lors de votre utilisation du site, nous collectons :</p>
        <ul>
          <li><strong>Adresse e-mail</strong> – pour l'authentification</li>
          <li><strong>Pseudo et slogan</strong> – choisis librement lors de l'inscription</li>
          <li><strong>Âge et sexe</strong> – renseignés lors de la création du profil</li>
          <li><strong>Programme politique</strong> – rédigé volontairement</li>
          <li><strong>Données de participation</strong> – score de popularité, duels joués, votes effectués</li>
        </ul>

        <h2>Base légale</h2>
        <p>Le traitement repose sur votre <strong>consentement</strong> donné lors de l'inscription, conformément à l'article 6(1)(a) du RGPD.</p>

        <h2>Finalité des traitements</h2>
        <ul>
          <li>Authentification et gestion de votre compte</li>
          <li>Affichage de votre programme et participation aux duels</li>
          <li>Classement et fonctionnalités sociales (amis, profil public)</li>
          <li>Modération des contenus</li>
        </ul>

        <h2>Sous-traitants</h2>
        <p><strong>Supabase Inc.</strong> assure l'hébergement de la base de données et le service d'authentification. Supabase est conforme au RGPD et dispose de garanties appropriées pour les transferts hors UE.</p>

        <h2>Durée de conservation</h2>
        <p>Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, l'ensemble de vos données est effacé dans un délai de 30 jours.</p>

        <h2>Vos droits</h2>
        <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition. Pour exercer ces droits, contactez-nous à <strong>wappydeveloppement@gmail.com</strong>.</p>
        <p>Vous pouvez également introduire une réclamation auprès de la <strong>CNIL</strong> (www.cnil.fr).</p>

        <h2>Cookies</h2>
        <p>Le site utilise uniquement des cookies strictement nécessaires au fonctionnement de l'authentification (session Supabase). Aucun cookie publicitaire ou de traçage tiers n'est utilisé.</p>
      </>
    ),
  },

  cgu: {
    title: "Conditions Générales d'Utilisation",
    content: (
      <>
        <h2>Objet</h2>
        <p>Les présentes CGU régissent l'accès et l'utilisation de la plateforme <strong>Mon Programme Politique</strong>, site participatif permettant à tout citoyen de présenter un programme politique fictif et de voter pour ceux des autres utilisateurs.</p>

        <h2>Accès au service</h2>
        <p>L'inscription est ouverte à toute personne disposant d'une adresse e-mail valide. L'utilisation est strictement personnelle et non commerciale.</p>

        <h2>Règles de bonne conduite</h2>
        <p>En utilisant la plateforme, vous vous engagez à :</p>
        <ul>
          <li>Ne pas publier de contenu haineux, discriminatoire, illégal ou diffamatoire</li>
          <li>Ne pas usurper l'identité d'un tiers (personne réelle, personnalité publique, parti politique)</li>
          <li>Ne pas perturber le bon fonctionnement du service (spam, scripts automatisés, etc.)</li>
          <li>Respecter les autres utilisateurs</li>
        </ul>

        <h2>Modération</h2>
        <p>Tout programme soumis est examiné par nos modérateurs avant publication. Tout contenu contraire aux règles ci-dessus sera refusé. En cas de manquements répétés ou graves, le compte peut être définitivement banni.</p>

        <h2>Propriété des contenus</h2>
        <p>Vous conservez la propriété intellectuelle de votre programme. En le publiant, vous accordez à la plateforme une licence non exclusive d'affichage et de diffusion auprès des autres utilisateurs.</p>

        <h2>Caractère fictif</h2>
        <p>Les programmes publiés sont fictifs et rédigés à des fins ludiques et participatives. Ils n'engagent pas leurs auteurs sur le plan politique ou juridique.</p>

        <h2>Disponibilité du service</h2>
        <p>L'éditeur s'efforce d'assurer la disponibilité du service mais ne garantit aucun niveau de service. Le service peut être interrompu à tout moment sans préavis.</p>

        <h2>Modification des CGU</h2>
        <p>L'éditeur se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés de tout changement significatif.</p>

        <h2>Droit applicable</h2>
        <p>Les présentes CGU sont régies par le droit français.</p>
      </>
    ),
  },
}

export default function LegalPage() {
  const { section } = useParams()
  const navigate = useNavigate()
  const data = SECTIONS[section] ?? SECTIONS.mentions

  return (
    <div className="legal-page">
      <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>

      <div className="legal-tabs">
        {Object.entries(SECTIONS).map(([key, s]) => (
          <button
            key={key}
            className={`legal-tab ${section === key ? 'active' : ''}`}
            onClick={() => navigate(`/legal/${key}`)}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="legal-content card">
        <h1>{data.title}</h1>
        {data.content}
      </div>
    </div>
  )
}
