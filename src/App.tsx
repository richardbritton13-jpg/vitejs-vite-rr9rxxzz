import React, { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('All');
  const [filterAge, setFilterAge] = useState('All');
  const [sheetUrl, setSheetUrl] = useState('');
  const [error, setError] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState(null); // State for the modal

  // A robust CSV parser to handle commas inside quoted text (like Google Forms generates)
  const parseCSV = (str) => {
    const arr = [];
    let quote = false;
    let row = 0;
    let col = 0;
    for (let c = 0; c < str.length; c++) {
      let cc = str[c], nc = str[c + 1];
      arr[row] = arr[row] || [];
      arr[row][col] = arr[row][col] || '';
      if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }
      if (cc === '"') { quote = !quote; continue; }
      if (cc === ',' && !quote) { ++col; continue; }
      if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
      if (cc === '\n' && !quote) { ++row; col = 0; continue; }
      if (cc === '\r' && !quote) { ++row; col = 0; continue; }
      arr[row][col] += cc;
    }
    return arr;
  };

  // Helper function to format Google Drive links into embeddable image URLs
  const formatImageUrl = (url) => {
    if (!url) return null;
    let id = null;
    if (url.includes('id=')) {
      id = url.split('id=')[1].split('&')[0];
    } else if (url.includes('/d/')) {
      const match = url.match(/\/d\/(.*?)\//);
      if (match && match[1]) id = match[1];
    }
    
    if (id) {
      // Using the thumbnail API often bypasses strict cross-origin display rules
      return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
    }
    return url;
  };

  const getAgeCategory = (ageStr) => {
    const age = parseInt(ageStr);
    if (isNaN(age)) return "Unknown";
    if (age < 18) return "U18";
    if (age < 20) return "U20";
    return "Senior";
  };

  const checkMedicalIssue = (notes, support) => {
    const combined = `${notes} ${support}`.toLowerCase();
    const keywords = ['injury', 'pain', 'surgery', 'rehab', 'sprain', 'tear', 'medical', 'asthma', 'hamstring', 'knee', 'ankle'];
    return keywords.some(kw => combined.includes(kw));
  };

  const processData = (csvText) => {
    const parsed = parseCSV(csvText);
    if (parsed.length < 2) return [];
    
    const headers = parsed[0].map(h => h.toLowerCase());
    const dataRows = parsed.slice(1).filter(r => r.length > 1 && r[0].trim() !== "");
    
    // Find prefixes for multi-athlete rows (e.g., "athlete 1: ", "athlete 2: ")
    const prefixes = [];
    headers.forEach(h => {
      if (h.includes('full name') && !h.includes('coach')) {
        const prefix = h.split('full name')[0];
        if (!prefixes.includes(prefix)) prefixes.push(prefix);
      }
    });
    if (prefixes.length === 0) prefixes.push(''); // Fallback if no specific prefix

    const idxFederation = headers.findIndex(h => h.includes("federation name"));
    const idxContact = headers.findIndex(h => h.includes("contact person email"));

    const allAthletes = [];
    let globalId = 0;

    dataRows.forEach((row) => {
      const getVal = (idx, fallback = "N/A") => (idx !== -1 && row[idx]) ? row[idx].trim() : fallback;
      const federation = getVal(idxFederation, "Unknown Federation");
      const contactEmail = getVal(idxContact, "No Email");
      const rawDate = row[0];

      prefixes.forEach(prefix => {
        const findIndex = (keyword) => headers.findIndex(h => h.startsWith(prefix) && h.includes(keyword.toLowerCase()));

        const idxName = findIndex("full name");
        const name = getVal(idxName, "");

        if (!name || name === "N/A") return; // Skip if this slot is empty

        const age = getVal(findIndex("current age"));
        const notes = getVal(findIndex("please describe"));
        const support = getVal(findIndex("support requirements"));

        allAthletes.push({
          id: globalId++,
          federation,
          contactEmail,
          name,
          photoUrl: formatImageUrl(getVal(findIndex("photo"), "")),
          dob: getVal(findIndex("date of birth")),
          age,
          ageCategory: getAgeCategory(age),
          height: getVal(findIndex("height")),
          gender: getVal(findIndex("gender category")),
          sport: getVal(findIndex("primary sport"), "Unspecified"),
          level: getVal(findIndex("level of participation")),
          event: getVal(findIndex("primary event")),
          experience: getVal(findIndex("level of experience")),
          pb: getVal(findIndex("personal best")),
          coach: getVal(findIndex("current coach")),
          location: getVal(findIndex("training location")),
          travel: getVal(findIndex("availability for international travel")),
          tournaments: getVal(findIndex("possible tournament")),
          conditioning: getVal(findIndex("physical conditioning")),
          support,
          frequency: getVal(findIndex("frequency of recent")),
          notes,
          hasMedicalIssue: checkMedicalIssue(notes, support),
          rawDate
        });
      });
    });

    return allAthletes;
  };

  useEffect(() => {
    // Pre-loading based on the latest snippet you shared to ensure it works instantly
    const mockUploadedData = `Timestamp,Email Address,Federation Name,Contact Person Email Address,Athlete 1: Full Name,Athlete 1: Upload a recent competition photo,Athlete 1: Date of Birth,Athlete 1: Current Age,Athlete 1: Height,Athlete 1: Gender Category,Athlete 1: Primary Sport,Athlete 1: Level of Participation,Athlete 1: Primary Event/Discipline/Team,Athlete 1: Category/Weight Class,"Athlete 1: Position/Speciality",Athlete 1: Level of Experience,"Athlete 1: Personal Best/Recent Top Result",Athlete 1: Current Coach's Full Name,"Where is the athlete currently training location?",Athlete 1: Availability for International Travel,Athlete 1: Possible Tournament/Competition Selection,Athlete 1: Other Tournament/Competition,Athlete 1: Rate the athlete's current physical conditioning level.,"Athlete 1: Please specify any specific support requirements",Athlete 1: Indicate the frequency of recent participation,Athlete 1: Please describe,Athlete 2: Full Name,Athlete 2: Upload a recent competition photo,Athlete 2: Date of Birth,Athlete 2: Current Age,Athlete 2: Height,Athlete 2: Gender Category,Athlete 2: Primary Sport,Athlete 2: Level of Participation,Athlete 2: Primary Event/Discipline/Team,Athlete 2: Category/Weight Class,"Athlete 2: Position/Speciality",Athlete 2: Level of Experience,"Athlete 2: Personal Best/Recent Top Result",Athlete 2: Current Coach's Full Name,"Where is the athlete currently training location?",Athlete 2: Availability for International Travel,Athlete 2: Possible Tournament/Competition Selection,Athlete 2: Other Tournament/Competition,Athlete 2: Rate the athlete's current physical conditioning level.,"Athlete 2: Please specify any specific support requirements",Athlete 2: Indicate the frequency of recent participation,Athlete 2: Please describe
5/16/2026 21:05:37,lca@mf.worldathletics.org,St. Lucia Athletics Association,dora@example.com,Destinee Cenac,https://drive.google.com/open?id=1aPEAlzJwDlXJ_hxyDYnYQRnZz_aX67TS,2/27/2010,16,6 ft,Female,Field Events,Approaching,High Jump,,High Jump,1-3 years,High Jump: 1.72 m (April 2026),Lenyn Leonce,Saint Lucia,Fully available,Regional Championships,N/A,6,"supplements, stipend and transportation",1-2 competitions,"N/A",Jady Emmanuel,https://drive.google.com/open?id=1_sg-C42l9gg1NO7b1kcCngcv3kFHQuX6,3/24/2009,17,5 ft 8,Female,Track,Approaching,100m and 200m,,,7-10 years,,Denise Herman,"Saint Lucia, Choiseul Secondary",Fully available,"Regional Championships, Continental Games",,7,N/A,1-2 competitions,2nd Hamstring Injury
5/16/2026 21:05:38,test@worldathletics.org,St. Lucia Athletics Association,test@example.com,Julien Alfred,,6/10/2001,24,5 ft 7,Female,Track,Elite,100m and 200m,,,10+ years,"100m: 10.72s",Edrick Floreal,"Texas, USA",Fully available,Olympics,,10,N/A,5+ competitions,None`;

    const athletes = processData(mockUploadedData);
    setData(athletes);
    setLoading(false);
  }, []);

  const handleFetchUrl = async () => {
    if (!sheetUrl) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(sheetUrl);
      if (!response.ok) throw new Error("Could not fetch the Google Sheet. Ensure it is published as a CSV.");
      const csvText = await response.text();
      const athletes = processData(csvText);
      setData(athletes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.event.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = filterSport === 'All' || item.sport.includes(filterSport);
    const matchesAge = filterAge === 'All' || item.ageCategory === filterAge;
    return matchesSearch && matchesSport && matchesAge;
  });

  const uniqueSports = ['All', ...new Set(data.map(item => item.sport).filter(s => s !== "Unspecified" && s !== "N/A"))];
  const uniqueAges = ['All', 'U18', 'U20', 'Senior', 'Unknown'];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-12">
      {/* Header Container */}
      <div className="bg-[#0A192F] text-white border-b-4 border-red-600 shadow-md">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight uppercase">
              St Lucia's Sports Athlete Directory Database
            </h1>
            <p className="text-gray-300 mt-1">Manage and view athlete profiles and form submissions.</p>
          </div>
          
          {/* Controls Area */}
          <div className="space-y-4">
            {/* Live Data Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Paste Google Sheet Published CSV URL to load live data..." 
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                className="flex-grow px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button 
                onClick={handleFetchUrl}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded uppercase tracking-wide transition-colors whitespace-nowrap shadow-sm"
              >
                Sync Live Data
              </button>
            </div>
            {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-sm">{error}</div>}

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-grow sm:w-2/3">
                <svg className="w-5 h-5 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search athletes by name or event..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex sm:w-1/3 gap-2">
                <select 
                  value={filterSport}
                  onChange={(e) => setFilterSport(e.target.value)}
                  className="w-1/2 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  {uniqueSports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
                <select 
                  value={filterAge}
                  onChange={(e) => setFilterAge(e.target.value)}
                  className="w-1/2 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  {uniqueAges.map(age => (
                    <option key={age} value={age}>{age === 'All' ? 'All Ages' : age}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredData.length > 0 ? (
              filteredData.map((athlete) => (
                <div key={athlete.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full group cursor-pointer" onClick={() => setSelectedAthlete(athlete)}>
                  
                  {/* Photo Area */}
                  <div className="h-48 w-full bg-slate-100 relative overflow-hidden border-b border-slate-100">
                    {athlete.photoUrl && athlete.photoUrl !== 'N/A' ? (
                      <img 
                        src={athlete.photoUrl} 
                        alt={athlete.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }} // Fallback if image fails
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Medical Badge */}
                    {athlete.hasMedicalIssue && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1 z-10">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        MED NOTE
                      </div>
                    )}

                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-semibold text-blue-700 shadow-sm">
                      {athlete.sport}
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {athlete.name}
                      </h3>
                      <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded ml-2 whitespace-nowrap">
                        {athlete.ageCategory}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-500 mb-4">{athlete.gender} • Age {athlete.age}</p>

                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700 w-16">Event:</span>
                        <span className="text-slate-600 truncate">{athlete.event}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700 w-16">Coach:</span>
                        <span className="text-slate-600 truncate">{athlete.coach}</span>
                      </div>
                      
                      {/* Mini Conditioning Bar */}
                      <div className="flex items-center gap-2 text-sm pt-1">
                        <span className="font-medium text-slate-700 w-16">Fitness:</span>
                        <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${parseInt(athlete.conditioning) >= 8 ? 'bg-green-500' : parseInt(athlete.conditioning) >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${(parseInt(athlete.conditioning) / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-500">{athlete.conditioning}/10</span>
                      </div>
                    </div>

                    <button className="mt-5 w-full py-2 bg-gray-50 hover:bg-red-50 text-red-600 text-sm font-bold uppercase rounded border border-gray-200 hover:border-red-200 transition-colors">
                      View Full Profile
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900">No athletes found</h3>
                <p className="text-slate-500 mt-1">Try adjusting your search terms or filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Profile Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800">Athlete Profile</h2>
              <button 
                onClick={() => setSelectedAthlete(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8">
                
                {/* Left Column: Photo & Core Stats */}
                <div className="w-full md:w-1/3 space-y-6">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200">
                    {selectedAthlete.photoUrl && selectedAthlete.photoUrl !== 'N/A' ? (
                      <img src={selectedAthlete.photoUrl} alt={selectedAthlete.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h3 className="text-2xl font-black text-[#0A192F] mb-1 uppercase">{selectedAthlete.name}</h3>
                    <div className="inline-flex px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold uppercase tracking-wider mb-4">
                      {selectedAthlete.sport}
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500 font-bold">Federation:</span> <span className="font-medium text-gray-900">{selectedAthlete.federation}</span></p>
                      <p><span className="text-gray-500 font-bold">Contact:</span> <a href={`mailto:${selectedAthlete.contactEmail}`} className="font-medium text-blue-600 hover:underline">{selectedAthlete.contactEmail}</a></p>
                      <hr className="my-2 border-gray-200" />
                      <p><span className="text-gray-500 font-bold">DOB:</span> <span className="font-medium text-gray-900">{selectedAthlete.dob}</span></p>
                      <p><span className="text-gray-500 font-bold">Age:</span> <span className="font-medium text-gray-900">{selectedAthlete.age}</span></p>
                      <p><span className="text-gray-500 font-bold">Gender:</span> <span className="font-medium text-gray-900">{selectedAthlete.gender}</span></p>
                      <p><span className="text-gray-500 font-bold">Height:</span> <span className="font-medium text-gray-900">{selectedAthlete.height}</span></p>
                    </div>
                  </div>
                  
                  {selectedAthlete.hasMedicalIssue && (
                    <div className="bg-red-50 p-4 rounded border border-red-200 mt-4">
                      <h4 className="text-red-800 font-bold flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Medical / Support Warning
                      </h4>
                      <p className="text-sm text-red-700">This athlete has notes indicating a potential medical issue, injury, or special support requirement. Please review the 'Readiness & Support' section below.</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Detailed Fields */}
                <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                  
                  {/* Athletic Details */}
                  <div className="col-span-full">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Athletic Profile</h4>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Primary Event</p>
                    <p className="font-medium text-slate-800">{selectedAthlete.event}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Level of Participation</p>
                    <p className="font-medium text-slate-800">{selectedAthlete.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Experience</p>
                    <p className="font-medium text-slate-800">{selectedAthlete.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Personal Best</p>
                    <p className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">{selectedAthlete.pb}</p>
                  </div>
                  
                  {/* Training & Logistics */}
                  <div className="col-span-full mt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Training & Logistics</h4>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Current Coach</p>
                    <p className="font-medium text-slate-800">{selectedAthlete.coach}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Training Location</p>
                    <p className="font-medium text-slate-800">{selectedAthlete.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">International Travel</p>
                    <p className="font-medium text-slate-800">{selectedAthlete.travel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Target Tournaments</p>
                    <p className="font-medium text-slate-800">{selectedAthlete.tournaments}</p>
                  </div>

                  {/* Health & Requirements */}
                  <div className="col-span-full mt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Readiness & Support</h4>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Conditioning Level</p>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-slate-800">{selectedAthlete.conditioning}/10</span>
                      <div className="flex-grow max-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${parseInt(selectedAthlete.conditioning) >= 8 ? 'bg-green-500' : parseInt(selectedAthlete.conditioning) >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${(parseInt(selectedAthlete.conditioning) / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Competition Frequency</p>
                    <p className="font-medium text-slate-800">{selectedAthlete.frequency}</p>
                  </div>
                  
                  <div className="col-span-full bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <p className="text-sm text-orange-800 font-semibold mb-1">Specific Support Requirements</p>
                    <p className="text-orange-900">{selectedAthlete.support}</p>
                  </div>

                  {selectedAthlete.notes !== 'N/A' && (
                    <div className="col-span-full bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-sm text-slate-700 font-semibold mb-1">Additional Notes (Injuries, etc.)</p>
                      <p className="text-slate-800">{selectedAthlete.notes}</p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}