import React from 'react';
import { Search } from 'lucide-react';
import { ResultsDisplay } from './ResultsDisplay';

const exampleData = {
  query: "Is screen time harmful for babies under 2?",
  results: {
    pros: [
      "Limited educational value possible when co-viewing with parents and using high-quality content [1]",
      "Can help develop digital literacy skills when introduced appropriately [2]"
    ],
    cons: [
      "Associated with delayed language development in children under 2 years [1]",
      "May interfere with sleep patterns and quality [2]",
      "Reduces time spent in crucial face-to-face interactions and physical play [3]",
      "Potential negative impact on attention span and cognitive development [3]"
    ],
    citations: [
      {
        id: 1,
        text: "American Academy of Pediatrics. Media and Young Minds. Pediatrics, 2016.",
        url: "https://doi.org/10.1542/peds.2016-2591"
      },
      {
        id: 2,
        text: "JAMA Pediatrics. Association Between Screen Time and Children's Performance on a Developmental Screening Test. 2019.",
        url: "https://doi.org/10.1001/jamapediatrics.2018.5056"
      },
      {
        id: 3,
        text: "Pediatrics. Digital Screen Time and Its Effects on Young Children. 2020.",
        url: "https://doi.org/10.1542/peds.2020-047308"
      }
    ]
  }
};

export function ExampleQueryDisplay() {
  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-50 rounded-xl p-8 space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
        See it in action
      </h2>
      
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={exampleData.query}
            readOnly
            className="w-full px-4 py-3 pr-12 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none cursor-default"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500">
            <Search className="w-5 h-5" />
          </div>
        </div>
      </div>

      <ResultsDisplay
        pros={exampleData.results.pros}
        cons={exampleData.results.cons}
        citations={exampleData.results.citations}
      />
    </div>
  );
}