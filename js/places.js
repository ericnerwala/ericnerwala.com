// City labels and the opening view. Personal places and stories are in stories.js.
//
// at:   [longitude, latitude]
// tier: 1 = the big one, 2 = major, 3 = notable, 4 = everything else
// "\n" in a name forces a line break. Long names wrap on their own.

// Where the map opens. zoom is Google's zoom level (the "z" in a Google Maps URL).
export const HOME = {
  center: [-74.881, 39.917],
  zoom: 9.365,
  // Inside this box the labels below replace the real map's city names.
  // Outside it, real place names show as usual. [west, south, east, north]
  bounds: [-76.52, 39.24, -73.4, 40.58],
};

export const PLACES = [
  { name: 'Philadelphia', at: [-75.1636, 39.9527], tier: 1 },

  { name: 'Wilmington', at: [-75.5527, 39.7383], tier: 2 },
  { name: 'Trenton', at: [-74.7659, 40.2203], tier: 2 },
  { name: 'Atlantic City', at: [-74.4229, 39.3643], tier: 2 },

  { name: 'Reading', at: [-75.928, 40.3354], tier: 3 },
  { name: 'Lancaster', at: [-76.3056, 40.038], tier: 3 },
  { name: 'Vineland', at: [-75.0255, 39.4863], tier: 3 },
  { name: 'Toms River', at: [-74.1968, 39.9528], tier: 3 },

  { name: 'Hamburg', at: [-75.9824, 40.5553], tier: 4 },
  { name: 'Emmaus', at: [-75.4919, 40.535], tier: 4 },
  { name: 'Edison', at: [-74.3984, 40.5006], tier: 4 },
  { name: 'Myerstown', at: [-76.3035, 40.3753], tier: 4 },
  { name: 'Lititz', at: [-76.3072, 40.1572], tier: 4 },
  { name: 'New Holland', at: [-76.0852, 40.1018], tier: 4 },
  { name: 'Pottstown', at: [-75.6496, 40.2453], tier: 4 },
  { name: 'Lansdale', at: [-75.2838, 40.2415], tier: 4 },
  { name: 'Doylestown', at: [-75.1304, 40.31], tier: 4 },
  { name: 'King of Prussia', at: [-75.3888, 40.0851], tier: 4 },
  { name: 'Ardmore', at: [-75.2911, 40.008], tier: 4 },
  { name: 'Exton', at: [-75.6208, 40.029], tier: 4 },
  { name: 'West Chester', at: [-75.6045, 39.9598], tier: 4 },
  { name: 'Kennett Square', at: [-75.7117, 39.8468], tier: 4 },
  { name: 'Princeton', at: [-74.6597, 40.3497], tier: 4 },
  { name: 'Monroe Township', at: [-74.4335, 40.3257], tier: 4 },
  { name: 'Old Bridge', at: [-74.3, 40.402], tier: 4 },
  { name: 'Middletown Township', at: [-74.0899, 40.3893], tier: 4 },
  { name: 'Long Branch', at: [-73.9923, 40.3043], tier: 4 },
  { name: 'Asbury Park', at: [-74.0121, 40.2204], tier: 4 },
  { name: 'Wall Township', at: [-74.0903, 40.1743], tier: 4 },
  { name: 'Jackson Township', at: [-74.262, 40.132], tier: 4 },
  { name: 'Lakewood', at: [-74.211, 40.0812], tier: 4 },
  { name: 'Berkeley Township', at: [-74.1807, 39.898], tier: 4 },
  { name: 'Lacey Township', at: [-74.2084, 39.8406], tier: 4 },
  { name: 'Barnegat Township', at: [-74.2229, 39.7532], tier: 4 },
  { name: 'Long Beach Island', at: [-74.1854, 39.6351], tier: 4 },
  { name: 'Little Egg\nHarbor\nTownship', at: [-74.3514, 39.594], tier: 4 },
  { name: 'Hammonton', at: [-74.8027, 39.6366], tier: 4 },
  { name: 'Voorhees Township', at: [-74.9619, 39.8512], tier: 4 },
  { name: 'Glassboro', at: [-75.112, 39.7028], tier: 4 },
  { name: 'Bridgeton', at: [-75.2341, 39.427], tier: 4 },
  { name: 'Millville', at: [-75.0394, 39.402], tier: 4 },
  { name: 'Somers Point', at: [-74.5946, 39.3176], tier: 4 },
  { name: 'Ocean City', at: [-74.5762, 39.2788], tier: 4 },
  { name: 'Newark', at: [-75.7516, 39.6828], tier: 4 },
  { name: 'Bear', at: [-75.6586, 39.6292], tier: 4 },
  { name: 'Elkton', at: [-75.8331, 39.6065], tier: 4 },
  { name: 'Middletown', at: [-75.7167, 39.4498], tier: 4 },
  { name: 'Smyrna', at: [-75.6046, 39.2998], tier: 4 },
  { name: 'Havre\nDe Grace', at: [-76.0898, 39.5488], tier: 4 },
  { name: 'Bel Air', at: [-76.3491, 39.5355], tier: 4 },
];

// Green labels: parks, forests, anything outdoors.
export const PARKS = [
  { name: 'Wharton\nState Forest', at: [-74.6364, 39.7083] },
  { name: 'Edwin B.\nForsythe\nNational\nWildlife…', at: [-74.4759, 39.4557], align: 'left' },
];

// The blue "you are here" dot. Public landmark, not a home address.
export const YOU = { at: [-75.1973, 39.95] };
