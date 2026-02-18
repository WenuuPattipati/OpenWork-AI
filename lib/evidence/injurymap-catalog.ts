/**
 * InjuryMap Anatomy Image Catalog
 * Local images with smart keyword matching for medical queries
 * License: CC BY 4.0 - Attribution required
 */

export interface InjuryMapImage {
  name: string;
  localPath: string;
  bodyPart: string;
  keywords: string[];
  source: string;
  attribution: string;
  license: string;
}

export const INJURYMAP_CATALOG: InjuryMapImage[] = [
  {
    name: "Hip & Groin Pain",
    localPath: "/injurymap/001_Hip_Groin_Pain.jpg",
    bodyPart: "hip",
    keywords: ["hip pain","groin pain","hip flexor","FAI","femoroacetabular impingement","hip arthritis","adductor strain","hip labral tear","trochanteric bursitis"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/hip-groin-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Ankle Pain",
    localPath: "/injurymap/002_Ankle_Pain.jpg",
    bodyPart: "ankle",
    keywords: ["ankle pain","ankle injury","ankle sprain","lateral ligament","ankle instability"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/ankle-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Ankle Sprain",
    localPath: "/injurymap/002_Ankle_Sprain.jpg",
    bodyPart: "ankle",
    keywords: ["ankle sprain","ankle pain","lateral ligament","ATFL","anterior talofibular","ankle instability","inversion injury","ankle roll"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/ankle-sprain",
    license: "CC BY 4.0"
  },
  {
    name: "Elbow Pain",
    localPath: "/injurymap/003_Elbow_Pain.jpg",
    bodyPart: "elbow",
    keywords: ["elbow pain","tennis elbow","golfer's elbow","lateral epicondylitis","medial epicondylitis","epicondylalgia","elbow tendinopathy"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/elbow-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Shoulder Pain",
    localPath: "/injurymap/003_Shoulder_Pain.jpg",
    bodyPart: "shoulder",
    keywords: ["shoulder pain","rotator cuff","impingement","frozen shoulder","adhesive capsulitis","subacromial","glenohumeral","shoulder instability"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/shoulder-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Hip Joint Pain",
    localPath: "/injurymap/004_Hip_Joint_Pain.jpg",
    bodyPart: "hip",
    keywords: ["hip joint pain","hip arthritis","hip osteoarthritis","hip joint","coxarthrosis"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/hip-joint-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Knee Pain",
    localPath: "/injurymap/004_Knee_Pain.jpg",
    bodyPart: "knee",
    keywords: ["knee pain","patellofemoral","meniscus","ACL","MCL","runner's knee","PFPS","chondromalacia","patellar tendinopathy","jumper's knee"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/knee-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Back Pain with Radiation",
    localPath: "/injurymap/005_Back_Pain_Radiation.jpg",
    bodyPart: "back",
    keywords: ["back pain","sciatica","radiculopathy","nerve pain","radiating pain","leg pain"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/back-pain-radiation",
    license: "CC BY 4.0"
  },
  {
    name: "Lower Back Pain",
    localPath: "/injurymap/005_Lower_Back_Pain.jpg",
    bodyPart: "back",
    keywords: ["lower back pain","lumbar","sciatica","disc herniation","LBP","lumbago","facet joint","spinal stenosis","radiculopathy"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/lower-back-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Neck Pain",
    localPath: "/injurymap/006_Neck_Pain.jpg",
    bodyPart: "neck",
    keywords: ["neck pain","cervical","whiplash","cervicalgia","neck strain","cervical radiculopathy","torticollis","cervical spondylosis"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/neck-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Shoulder Pain",
    localPath: "/injurymap/006_Shoulder_Pain.jpg",
    bodyPart: "shoulder",
    keywords: ["shoulder pain","rotator cuff","impingement","shoulder injury"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/shoulder-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Elbow Pain",
    localPath: "/injurymap/007_Elbow_Pain.jpg",
    bodyPart: "elbow",
    keywords: ["elbow pain","tennis elbow","golfer's elbow","lateral epicondylitis","medial epicondylitis"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/elbow-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Neck Pain",
    localPath: "/injurymap/007_Neck_Pain.jpg",
    bodyPart: "neck",
    keywords: ["neck pain","cervical","neck strain","cervical spine"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/neck-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Heel Pain Under",
    localPath: "/injurymap/008_Heel_Pain_Under.jpg",
    bodyPart: "foot",
    keywords: ["heel pain","plantar fasciitis","heel spur","plantar heel pain","foot pain"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/heel-pain-under",
    license: "CC BY 4.0"
  },
  {
    name: "Wrist Pain",
    localPath: "/injurymap/008_Wrist_Pain.jpg",
    bodyPart: "wrist",
    keywords: ["wrist pain","carpal tunnel","CTS","TFCC","triangular fibrocartilage","wrist sprain","De Quervain","tenosynovitis","scaphoid fracture"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/wrist-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Back Pain",
    localPath: "/injurymap/009_Back_Pain.jpg",
    bodyPart: "back",
    keywords: ["back pain","lumbar pain","spine pain","back injury"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/back-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Plantar Fasciitis",
    localPath: "/injurymap/009_Plantar_Fasciitis.jpg",
    bodyPart: "foot",
    keywords: ["plantar fasciitis","heel pain","foot pain","heel spur","plantar fasciosis","plantar heel pain","calcaneal spur"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/plantar-fasciitis",
    license: "CC BY 4.0"
  },
  {
    name: "Achilles Tendinopathy",
    localPath: "/injurymap/010_Achilles_Tendinopathy.jpg",
    bodyPart: "ankle",
    keywords: ["achilles tendinopathy","achilles pain","achilles tendinitis","heel cord","achilles rupture","insertional achilles","mid-portion achilles"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/achilles-tendinopathy",
    license: "CC BY 4.0"
  },
  {
    name: "Knee Joint Pain",
    localPath: "/injurymap/010_Knee_Joint_Pain.jpg",
    bodyPart: "knee",
    keywords: ["knee joint pain","knee arthritis","knee osteoarthritis","joint pain"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/knee-joint-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Heel Pain Back",
    localPath: "/injurymap/011_Heel_Pain_Back.jpg",
    bodyPart: "ankle",
    keywords: ["heel pain","achilles","posterior heel pain","heel cord pain"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/heel-pain-back",
    license: "CC BY 4.0"
  },
  {
    name: "IT Band Syndrome",
    localPath: "/injurymap/011_IT_Band_Syndrome.jpg",
    bodyPart: "knee",
    keywords: ["IT band syndrome","iliotibial band","ITBS","lateral knee pain","ITB friction syndrome","runner's knee"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/it-band-syndrome",
    license: "CC BY 4.0"
  },
  {
    name: "Hamstring Strain",
    localPath: "/injurymap/012_Hamstring_Strain.jpg",
    bodyPart: "thigh",
    keywords: ["hamstring strain","hamstring tear","posterior thigh pain","hamstring injury","biceps femoris","semitendinosus","semimembranosus"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/hamstring-strain",
    license: "CC BY 4.0"
  },
  {
    name: "Knee Soft Tissue Pain",
    localPath: "/injurymap/012_Knee_Soft_Tissue.jpg",
    bodyPart: "knee",
    keywords: ["knee soft tissue","knee pain","soft tissue injury","knee ligament"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/knee-soft-tissue",
    license: "CC BY 4.0"
  },
  {
    name: "Calf Strain",
    localPath: "/injurymap/013_Calf_Strain.jpg",
    bodyPart: "calf",
    keywords: ["calf strain","gastrocnemius strain","calf tear","calf pain","soleus strain","tennis leg"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/calf-strain",
    license: "CC BY 4.0"
  },
  {
    name: "Headache",
    localPath: "/injurymap/013_Headache.jpg",
    bodyPart: "head",
    keywords: ["headache","head pain","migraine","tension headache","cervicogenic headache"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/headache",
    license: "CC BY 4.0"
  },
  {
    name: "Shin Splints",
    localPath: "/injurymap/014_Shin_Splints.jpg",
    bodyPart: "shin",
    keywords: ["shin splints","MTSS","medial tibial stress syndrome","shin pain","tibial stress","anterior shin splints"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/shin-splints",
    license: "CC BY 4.0"
  },
  {
    name: "Wrist Pain",
    localPath: "/injurymap/014_Wrist_Pain.jpg",
    bodyPart: "wrist",
    keywords: ["wrist pain","wrist injury","carpal tunnel","wrist sprain"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/wrist-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Knee Pain",
    localPath: "/injurymap/015_Knee_Pain.jpg",
    bodyPart: "knee",
    keywords: ["knee pain","knee injury","patellofemoral pain"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/knee-pain",
    license: "CC BY 4.0"
  },
  {
    name: "Quadriceps Strain",
    localPath: "/injurymap/015_Quadriceps_Strain.jpg",
    bodyPart: "thigh",
    keywords: ["quadriceps strain","quad strain","thigh strain","rectus femoris","vastus lateralis","vastus medialis","anterior thigh pain"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/quadriceps-strain",
    license: "CC BY 4.0"
  },
  {
    name: "Lateral Collateral Ligament",
    localPath: "/injurymap/016_LCL.jpg",
    bodyPart: "knee",
    keywords: ["LCL","lateral collateral ligament","knee ligament","lateral knee injury"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/lcl",
    license: "CC BY 4.0"
  },
  {
    name: "Piriformis Syndrome",
    localPath: "/injurymap/016_Piriformis_Syndrome.jpg",
    bodyPart: "hip",
    keywords: ["piriformis syndrome","deep gluteal syndrome","sciatic nerve","buttock pain","piriformis","gluteal pain"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/piriformis-syndrome",
    license: "CC BY 4.0"
  },
  {
    name: "Bad Posture",
    localPath: "/injurymap/017_Bad_Posture.jpg",
    bodyPart: "spine",
    keywords: ["bad posture","poor posture","posture","spine alignment","kyphosis","forward head"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/bad-posture",
    license: "CC BY 4.0"
  },
  {
    name: "Rotator Cuff",
    localPath: "/injurymap/017_Rotator_Cuff.jpg",
    bodyPart: "shoulder",
    keywords: ["rotator cuff tear","supraspinatus","infraspinatus","RC tear","subscapularis","teres minor","rotator cuff injury"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/rotator-cuff",
    license: "CC BY 4.0"
  },
  {
    name: "Biceps Tendinitis",
    localPath: "/injurymap/018_Biceps_Tendinitis.jpg",
    bodyPart: "arm",
    keywords: ["biceps tendinitis","biceps tendinopathy","bicipital tendinitis","long head biceps","biceps pain"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/biceps-tendinitis",
    license: "CC BY 4.0"
  },
  {
    name: "Quadriceps Tendon",
    localPath: "/injurymap/018_Quadriceps_Tendon.jpg",
    bodyPart: "knee",
    keywords: ["quadriceps tendon","quad tendon","patellar tendon","knee tendon","tendinopathy"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/quadriceps-tendon",
    license: "CC BY 4.0"
  },
  {
    name: "Quadriceps Muscle",
    localPath: "/injurymap/019_Quadriceps_Muscle.jpg",
    bodyPart: "thigh",
    keywords: ["quadriceps muscle","quad muscle","thigh muscle","rectus femoris","vastus"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/quadriceps-muscle",
    license: "CC BY 4.0"
  },
  {
    name: "Thoracic Outlet Syndrome",
    localPath: "/injurymap/019_Thoracic_Outlet.jpg",
    bodyPart: "shoulder",
    keywords: ["thoracic outlet syndrome","TOS","brachial plexus","neurovascular compression","scalene","first rib"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/thoracic-outlet",
    license: "CC BY 4.0"
  },
  {
    name: "Hamstring Tear",
    localPath: "/injurymap/020_Hamstring_Tear.jpg",
    bodyPart: "thigh",
    keywords: ["hamstring tear","hamstring rupture","hamstring injury","posterior thigh tear"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/hamstring-tear",
    license: "CC BY 4.0"
  },
  {
    name: "Spine Injury",
    localPath: "/injurymap/021_Spine_Injury.jpg",
    bodyPart: "spine",
    keywords: ["spine injury","spinal injury","vertebral injury","back injury"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/spine-injury",
    license: "CC BY 4.0"
  },
  {
    name: "Kyphosis",
    localPath: "/injurymap/022_Kyphosis.jpg",
    bodyPart: "spine",
    keywords: ["kyphosis","dowager's hump","thoracic kyphosis","rounded back","hunchback"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/kyphosis",
    license: "CC BY 4.0"
  },
  {
    name: "Spine Anatomy",
    localPath: "/injurymap/023_Spine.jpg",
    bodyPart: "spine",
    keywords: ["spine","vertebrae","spinal column","back anatomy","cervical","thoracic","lumbar"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/spine",
    license: "CC BY 4.0"
  },
  {
    name: "Unhealthy Lifestyle",
    localPath: "/injurymap/024_Unhealthy_Lifestyle.jpg",
    bodyPart: "general",
    keywords: ["unhealthy lifestyle","sedentary","poor health","lifestyle"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/unhealthy-lifestyle",
    license: "CC BY 4.0"
  },
  {
    name: "Runners #1",
    localPath: "/injurymap/025_Runners_1.jpg",
    bodyPart: "general",
    keywords: ["running","runner","running injury","sports"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/runners-1",
    license: "CC BY 4.0"
  },
  {
    name: "Runners #2",
    localPath: "/injurymap/026_Runners_2.jpg",
    bodyPart: "general",
    keywords: ["running","runner","running injury","sports"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/runners-2",
    license: "CC BY 4.0"
  },
  {
    name: "Runners #3",
    localPath: "/injurymap/027_Runners_3.jpg",
    bodyPart: "general",
    keywords: ["running","runner","running injury","sports"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/runners-3",
    license: "CC BY 4.0"
  },
  {
    name: "Leptin and Ghrelin",
    localPath: "/injurymap/028_Leptin_Ghrelin.jpg",
    bodyPart: "general",
    keywords: ["leptin","ghrelin","hormones","appetite","metabolism","weight"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/leptin-ghrelin",
    license: "CC BY 4.0"
  },
  {
    name: "Osteoarthritic Spine",
    localPath: "/injurymap/029_Osteoarthritic_Spine.jpg",
    bodyPart: "spine",
    keywords: ["osteoarthritis","spine arthritis","spinal osteoarthritis","degenerative spine"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/osteoarthritic-spine",
    license: "CC BY 4.0"
  },
  {
    name: "Herniated Disk",
    localPath: "/injurymap/030_Herniated_Disk.jpg",
    bodyPart: "spine",
    keywords: ["herniated disk","disc herniation","slipped disc","bulging disc","ruptured disc"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/herniated-disk",
    license: "CC BY 4.0"
  },
  {
    name: "Frontal Cortex, Hippocampus and Amygdala",
    localPath: "/injurymap/031_Frontal_Cortex.jpg",
    bodyPart: "brain",
    keywords: ["brain","frontal cortex","hippocampus","amygdala","neurology","brain anatomy"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/frontal-cortex",
    license: "CC BY 4.0"
  },
  {
    name: "Brain Anatomy",
    localPath: "/injurymap/032_Brain.jpg",
    bodyPart: "brain",
    keywords: ["brain","brain anatomy","cerebral","neurology","CNS"],
    source: "InjuryMap",
    attribution: "https://www.injurymap.com/diagnoses/brain",
    license: "CC BY 4.0"
  }

];

/**
 * Search for relevant anatomy images based on query
 */
export function searchInjuryMapImages(query: string): InjuryMapImage[] {
  const queryLower = query.toLowerCase();
  const matches: Array<{ image: InjuryMapImage; score: number }> = [];

  for (const image of INJURYMAP_CATALOG) {
    let score = 0;
    
    // Check body part match
    if (queryLower.includes(image.bodyPart)) score += 10;
    
    // Check keyword matches
    for (const keyword of image.keywords) {
      if (queryLower.includes(keyword.toLowerCase())) {
        score += 5;
      }
    }
    
    if (score > 0) {
      matches.push({ image, score });
    }
  }

  // Sort by relevance score
  matches.sort((a, b) => b.score - a.score);
  
  // Return top 3 most relevant images
  return matches.slice(0, 3).map(m => m.image);
}

