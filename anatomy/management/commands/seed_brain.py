
from django.core.management.base import BaseCommand
from anatomy.models import BrainPart


BRAIN_PARTS = [
    {
        "name": "Frontal Lobe",
        "slug": "frontal-lobe",
        "category": "lobe",
        "color": "#F97316",
        "location": (
            "The frontal lobe occupies the anterior portion of the cerebral "
            "hemisphere, extending from the frontal pole to the central sulcus. "
            "It lies above the lateral sulcus."
        ),
        "function": (
            "Responsible for executive functions such as planning, reasoning, "
            "decision-making, problem-solving, impulse control, and aspects of "
            "personality. It also contains important motor and language-related "
            "areas, including the primary motor cortex and, in most people, "
            "Broca's area."
        ),
        "damage_effects": (
            "Damage may cause changes in personality, impaired judgment, "
            "difficulty planning and organizing, reduced impulse control, "
            "emotional changes, weakness or paralysis depending on the affected "
            "motor region, and difficulty producing speech if language-related "
            "areas are involved."
        ),
        "fact": (
            "The frontal lobe is one of the last brain regions to complete "
            "its development, with maturation continuing into early adulthood."
        ),
        "is_deep": False,
        "is_midline": False,
        "sort_order": 1,
    },
    {
        "name": "Parietal Lobe",
        "slug": "parietal-lobe",
        "category": "lobe",
        "color": "#EAB308",
        "location": (
            "Located in the upper rear portion of each cerebral hemisphere, "
            "behind the central sulcus and above the lateral sulcus. It extends "
            "toward the occipital lobe."
        ),
        "function": (
            "Integrates sensory information from different parts of the body. "
            "It contributes to touch perception, body awareness, spatial "
            "orientation, attention, and the processing of information about "
            "the position and movement of body parts."
        ),
        "damage_effects": (
            "Damage may cause impaired sensation, difficulty recognizing "
            "objects through touch, spatial disorientation, difficulty attending "
            "to one side of space, or problems with coordinated movements. "
            "Damage to the right parietal lobe can cause left-sided spatial neglect."
        ),
        "fact": (
            "The parietal lobe helps construct an internal representation "
            "of where the body is located in surrounding space."
        ),
        "is_deep": False,
        "is_midline": False,
        "sort_order": 2,
    },
    {
        "name": "Temporal Lobe",
        "slug": "temporal-lobe",
        "category": "lobe",
        "color": "#A78BFA",
        "location": (
            "Located on the lateral sides of the cerebral hemispheres, "
            "below the lateral sulcus and beneath portions of the frontal "
            "and parietal lobes."
        ),
        "function": (
            "Involved in auditory processing, language comprehension, "
            "memory formation, recognition of objects and faces, and "
            "aspects of emotion. Its medial regions contain important "
            "memory-related structures, including the hippocampus."
        ),
        "damage_effects": (
            "Damage may cause difficulty understanding spoken language, "
            "memory impairment, problems recognizing familiar objects or "
            "faces, auditory processing difficulties, or changes in emotional "
            "responses, depending on the affected region."
        ),
        "fact": (
            "The medial temporal lobe contains the hippocampus, a structure "
            "essential for forming many types of new declarative memories."
        ),
        "is_deep": False,
        "is_midline": False,
        "sort_order": 3,
    },
    {
        "name": "Occipital Lobe",
        "slug": "occipital-lobe",
        "category": "lobe",
        "color": "#22C55E",
        "location": (
            "Located at the posterior end of the cerebral hemispheres. "
            "It lies behind the parietal and temporal lobes and contains "
            "the primary visual cortex."
        ),
        "function": (
            "Primarily responsible for processing visual information. "
            "Different areas analyze visual features such as edges, "
            "orientation, color, motion, and spatial characteristics."
        ),
        "damage_effects": (
            "Damage may cause visual field defects, difficulty processing "
            "visual information, visual recognition problems, or cortical "
            "blindness in severe cases involving both hemispheres."
        ),
        "fact": (
            "The primary visual cortex is located around the calcarine sulcus "
            "on the medial surface of the occipital lobe."
        ),
        "is_deep": False,
        "is_midline": False,
        "sort_order": 4,
    },
    {
        "name": "Motor Cortex",
        "slug": "motor-cortex",
        "category": "cortex",
        "color": "#EF4444",
        "location": (
            "The primary motor cortex is located in the precentral gyrus "
            "of the frontal lobe, immediately anterior to the central sulcus."
        ),
        "function": (
            "Generates neural commands involved in voluntary movement. "
            "Different portions of the motor cortex contribute to controlling "
            "movements of different body regions. Each hemisphere primarily "
            "controls the opposite side of the body."
        ),
        "damage_effects": (
            "Damage may cause weakness or paralysis on the opposite side "
            "of the body, depending on the location and extent of the injury. "
            "Fine motor control and coordinated voluntary movement may also "
            "be affected."
        ),
        "fact": (
            "The motor homunculus is a representation of body parts across "
            "the motor cortex. Body regions requiring precise movement "
            "receive disproportionately large cortical representations."
        ),
        "is_deep": False,
        "is_midline": False,
        "sort_order": 5,
    },
    {
        "name": "Somatosensory Cortex",
        "slug": "somatosensory-cortex",
        "category": "cortex",
        "color": "#06B6D4",
        "location": (
            "The primary somatosensory cortex is located in the postcentral "
            "gyrus of the parietal lobe, immediately posterior to the "
            "central sulcus."
        ),
        "function": (
            "Processes sensory information from the body, including touch, "
            "pressure, vibration, pain, temperature, and proprioception. "
            "It contributes to awareness of bodily sensations."
        ),
        "damage_effects": (
            "Damage may cause reduced or altered sensation on the opposite "
            "side of the body, difficulty identifying objects through touch, "
            "and impaired awareness of body position."
        ),
        "fact": (
            "The somatosensory homunculus represents the body across the "
            "cortex, with sensitive areas such as the hands and lips "
            "occupying relatively large cortical regions."
        ),
        "is_deep": False,
        "is_midline": False,
        "sort_order": 6,
    },
    {
        "name": "Broca's Area",
        "slug": "brocas-area",
        "category": "cortex",
        "color": "#F472B6",
        "location": (
            "Typically located in the inferior frontal gyrus of the "
            "dominant cerebral hemisphere, most often the left hemisphere. "
            "It includes portions of the pars opercularis and pars triangularis."
        ),
        "function": (
            "Contributes to speech production, language planning, and "
            "the organization of speech-related movements. It works "
            "together with a wider network of language regions."
        ),
        "damage_effects": (
            "Damage may result in Broca's aphasia, characterized by "
            "effortful and reduced speech production. Comprehension of "
            "simple sentences may remain relatively preserved, although "
            "complex grammatical comprehension can also be affected."
        ),
        "fact": (
            "Broca's area is named after physician Paul Broca, who studied "
            "patients with language production difficulties."
        ),
        "is_deep": False,
        "is_midline": False,
        "sort_order": 7,
    },
    {
        "name": "Wernicke's Area",
        "slug": "wernickes-area",
        "category": "cortex",
        "color": "#C084FC",
        "location": (
            "Classically associated with the posterior superior temporal "
            "region of the dominant hemisphere, usually the left. Language "
            "comprehension involves a broader distributed network."
        ),
        "function": (
            "Contributes to understanding spoken and written language, "
            "accessing word meanings, and integrating linguistic information."
        ),
        "damage_effects": (
            "Damage in the relevant language network may cause Wernicke's "
            "aphasia, characterized by fluent but often poorly meaningful "
            "speech and impaired language comprehension."
        ),
        "fact": (
            "Modern neuroscience views language comprehension as a network "
            "function rather than the responsibility of one isolated region."
        ),
        "is_deep": False,
        "is_midline": False,
        "sort_order": 8,
    },
    {
        "name": "Auditory Cortex",
        "slug": "auditory-cortex",
        "category": "cortex",
        "color": "#38BDF8",
        "location": (
            "Located primarily in the superior temporal plane, including "
            "the transverse temporal gyri, also known as Heschl's gyri."
        ),
        "function": (
            "Processes sound information such as frequency, intensity, "
            "timing, and sound patterns. It contributes to the perception "
            "and interpretation of auditory stimuli."
        ),
        "damage_effects": (
            "Damage may impair sound processing and auditory perception. "
            "Because auditory information is represented bilaterally, "
            "damage to one primary auditory cortex does not usually cause "
            "complete deafness in one ear."
        ),
        "fact": (
            "The auditory cortex contains an organized representation "
            "of sound frequencies, known as tonotopy."
        ),
        "is_deep": False,
        "is_midline": False,
        "sort_order": 9,
    },
    {
        "name": "Cerebellum",
        "slug": "cerebellum",
        "category": "structure",
        "color": "#14B8A6",
        "location": (
            "Located in the posterior cranial fossa, beneath the occipital "
            "lobes and behind the brainstem. It consists of two hemispheres "
            "connected by the central vermis."
        ),
        "function": (
            "Coordinates movement, balance, posture, and motor learning. "
            "It helps refine the timing, precision, and coordination of "
            "movements. It also contributes to certain cognitive processes."
        ),
        "damage_effects": (
            "Damage may cause ataxia, poor balance, uncoordinated movements, "
            "intention tremor, abnormal eye movements, and difficulty "
            "performing precise movements."
        ),
        "fact": (
            "Although the cerebellum occupies a relatively small portion "
            "of total brain volume, it contains a very large proportion "
            "of the brain's neurons."
        ),
        "is_deep": False,
        "is_midline": False,
        "sort_order": 10,
    },
    {
        "name": "Midbrain",
        "slug": "midbrain",
        "category": "structure",
        "color": "#F59E0B",
        "location": (
            "The uppermost portion of the brainstem, located between "
            "the diencephalon and the pons. It surrounds the cerebral "
            "aqueduct."
        ),
        "function": (
            "Involved in eye movements, visual and auditory reflexes, "
            "motor control, alertness, and the regulation of movement. "
            "It contains structures such as the substantia nigra "
            "and red nucleus."
        ),
        "damage_effects": (
            "Damage may cause abnormalities in eye movement, impaired "
            "visual or auditory reflexes, movement disorders, weakness, "
            "or disturbances in consciousness, depending on the affected area."
        ),
        "fact": (
            "The substantia nigra, located in the midbrain, contains "
            "dopamine-producing neurons that are significantly affected "
            "in Parkinson's disease."
        ),
        "is_deep": True,
        "is_midline": True,
        "sort_order": 11,
    },
    {
        "name": "Pons",
        "slug": "pons",
        "category": "structure",
        "color": "#FB923C",
        "location": (
            "Located in the brainstem between the midbrain above and "
            "the medulla oblongata below. It lies anterior to the cerebellum."
        ),
        "function": (
            "Acts as an important communication pathway between the "
            "cerebral cortex, cerebellum, and other brain regions. It also "
            "contains nuclei involved in sleep, breathing, facial sensation, "
            "facial movement, and eye movement."
        ),
        "damage_effects": (
            "Damage may cause facial weakness, sensory disturbances, "
            "abnormal eye movements, impaired coordination, breathing "
            "disturbances, or severe paralysis in extensive injuries."
        ),
        "fact": (
            "The name pons means bridge, reflecting its role in connecting "
            "different parts of the nervous system."
        ),
        "is_deep": True,
        "is_midline": True,
        "sort_order": 12,
    },
    {
        "name": "Medulla Oblongata",
        "slug": "medulla-oblongata",
        "category": "structure",
        "color": "#DC2626",
        "location": (
            "The lowest portion of the brainstem, located between the pons "
            "and the spinal cord. It lies anterior to the cerebellum."
        ),
        "function": (
            "Contains neural centers and pathways involved in essential "
            "autonomic functions, including regulation of breathing, "
            "heart rate, blood pressure, swallowing, coughing, and vomiting."
        ),
        "damage_effects": (
            "Severe damage may disrupt breathing, cardiovascular regulation, "
            "swallowing, and other vital functions. Extensive injury can be "
            "life-threatening."
        ),
        "fact": (
            "Many motor pathways cross to the opposite side of the body "
            "in the lower medulla at the pyramidal decussation."
        ),
        "is_deep": True,
        "is_midline": True,
        "sort_order": 13,
    },
    {
        "name": "Corpus Callosum",
        "slug": "corpus-callosum",
        "category": "structure",
        "color": "#E879F9",
        "location": (
            "A large C-shaped bundle of white matter located deep within "
            "the brain, between the two cerebral hemispheres and above "
            "the lateral ventricles."
        ),
        "function": (
            "Connects the left and right cerebral hemispheres through "
            "commissural nerve fibers, allowing information to be "
            "communicated between corresponding and different cortical regions."
        ),
        "damage_effects": (
            "Damage or disruption may interfere with communication between "
            "the hemispheres. Some individuals may experience split-brain "
            "effects, difficulty coordinating information across hemispheres, "
            "or impaired interhemispheric transfer."
        ),
        "fact": (
            "The corpus callosum is the largest commissural fiber tract "
            "in the human brain."
        ),
        "is_deep": True,
        "is_midline": True,
        "sort_order": 14,
    },
    {
        "name": "Thalamus",
        "slug": "thalamus",
        "category": "structure",
        "color": "#8B5CF6",
        "location": (
            "Located deep within the diencephalon, on either side of "
            "the third ventricle and above the hypothalamus."
        ),
        "function": (
            "Acts as a major relay and processing center for sensory "
            "information traveling to the cerebral cortex, with the "
            "important exception of much olfactory information. It also "
            "contributes to attention, consciousness, sleep, and motor circuits."
        ),
        "damage_effects": (
            "Damage may cause sensory disturbances, altered consciousness, "
            "memory difficulties, impaired attention, or thalamic pain "
            "syndrome involving persistent abnormal sensations."
        ),
        "fact": (
            "Nearly all sensory systems, except much of the olfactory system, "
            "send information through thalamic nuclei before reaching "
            "the cerebral cortex."
        ),
        "is_deep": True,
        "is_midline": False,
        "sort_order": 15,
    },
    {
        "name": "Basal Ganglia",
        "slug": "basal-ganglia",
        "category": "structure",
        "color": "#84CC16",
        "location": (
            "A group of interconnected subcortical nuclei located deep "
            "within the cerebral hemispheres. Major components include "
            "the caudate nucleus, putamen, and globus pallidus."
        ),
        "function": (
            "Participates in the selection and initiation of actions, "
            "movement regulation, habit formation, procedural learning, "
            "and reward-related processes through interconnected neural circuits."
        ),
        "damage_effects": (
            "Disorders involving basal ganglia circuits may produce "
            "abnormal movements, including tremor, rigidity, slowed movement, "
            "involuntary movements, and difficulties initiating or controlling "
            "voluntary actions."
        ),
        "fact": (
            "The basal ganglia are strongly associated with Parkinson's "
            "disease and Huntington's disease, although these conditions "
            "involve different underlying mechanisms."
        ),
        "is_deep": True,
        "is_midline": False,
        "sort_order": 16,
    },
    {
        "name": "Hypothalamus",
        "slug": "hypothalamus",
        "category": "structure",
        "color": "#EC4899",
        "location": (
            "Located below the thalamus and forms part of the floor "
            "and lower walls of the third ventricle. It connects to "
            "the pituitary gland through the infundibulum."
        ),
        "function": (
            "Maintains homeostasis by regulating body temperature, hunger, "
            "thirst, sleep-wake cycles, autonomic activity, stress responses, "
            "and endocrine functions through its connection with the "
            "pituitary gland."
        ),
        "damage_effects": (
            "Damage may disrupt temperature regulation, appetite, thirst, "
            "sleep, hormone regulation, reproductive functions, and "
            "autonomic processes."
        ),
        "fact": (
            "The hypothalamus helps coordinate the nervous system "
            "and endocrine system, linking neural signals with hormonal "
            "responses."
        ),
        "is_deep": True,
        "is_midline": True,
        "sort_order": 17,
    },
    {
        "name": "Pituitary Gland",
        "slug": "pituitary-gland",
        "category": "structure",
        "color": "#F472B6",
        "location": (
            "A small endocrine gland located beneath the hypothalamus "
            "in the sella turcica of the sphenoid bone. It is connected "
            "to the hypothalamus by the pituitary stalk."
        ),
        "function": (
            "Secretes hormones that regulate growth, metabolism, reproduction, "
            "lactation, and other endocrine functions. The anterior pituitary "
            "produces several hormones, while the posterior pituitary releases "
            "oxytocin and vasopressin produced by hypothalamic neurons."
        ),
        "damage_effects": (
            "Damage or disease may cause hormone deficiencies or excesses, "
            "growth disturbances, reproductive problems, changes in "
            "metabolism, and disturbances in water balance."
        ),
        "fact": (
            "The pituitary is often called the master gland, but its activity "
            "is itself regulated by the hypothalamus and other feedback systems."
        ),
        "is_deep": True,
        "is_midline": True,
        "sort_order": 18,
    },
    {
        "name": "Hippocampus",
        "slug": "hippocampus",
        "category": "structure",
        "color": "#06D6A0",
        "location": (
            "A curved structure located in the medial temporal lobe "
            "of each cerebral hemisphere, forming part of the hippocampal "
            "formation."
        ),
        "function": (
            "Essential for forming and consolidating many types of new "
            "declarative memories. It also contributes to spatial memory, "
            "navigation, and the organization of experiences."
        ),
        "damage_effects": (
            "Damage may cause anterograde amnesia, involving difficulty "
            "forming new long-term declarative memories. It may also impair "
            "spatial navigation and certain forms of memory retrieval."
        ),
        "fact": (
            "The hippocampus is named after its resemblance to a seahorse. "
            "The name comes from the Greek words for horse and sea monster."
        ),
        "is_deep": True,
        "is_midline": False,
        "sort_order": 19,
    },
    {
        "name": "Amygdala",
        "slug": "amygdala",
        "category": "structure",
        "color": "#F43F5E",
        "location": (
            "An almond-shaped group of nuclei located deep within the "
            "medial temporal lobe, near the anterior portion of the hippocampus."
        ),
        "function": (
            "Contributes to processing emotional significance, especially "
            "threat-related information, emotional learning, fear conditioning, "
            "and the integration of emotion with memory."
        ),
        "damage_effects": (
            "Damage may alter emotional learning, recognition of emotional "
            "signals, and responses to threatening stimuli. Effects vary "
            "depending on the affected nuclei and connected networks."
        ),
        "fact": (
            "The word amygdala comes from the Greek word for almond, "
            "describing its approximate shape."
        ),
        "is_deep": True,
        "is_midline": False,
        "sort_order": 20,
    },
]


class Command(BaseCommand):
    help = "Populate the database with major human brain structures."

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for part_data in BRAIN_PARTS:
            part, created = BrainPart.objects.update_or_create(
                slug=part_data["slug"],
                defaults={
                    **part_data,
                    "mesh_name": "",
                },
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Created: {part.name}")
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f"Updated: {part.name}")
                )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Database seeding complete: "
                f"{created_count} created, {updated_count} updated."
            )
        )
        self.stdout.write(
            f"Total brain structures in database: {BrainPart.objects.count()}"
        )
