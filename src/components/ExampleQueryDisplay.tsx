import React from 'react';
import { Search } from 'lucide-react';
import { ResultsDisplay } from './ResultsDisplay';

const exampleData = {
  query: "Is screen time harmful for babies under 2?",
  results: {
    pros: [
      "Some studies report positive cognitive outcomes from interactive screen content [1]",
      "Can support learning when used in appropriate contexts with parental involvement [2]",
      "No direct causal relationship found between screen exposure and cognitive harm [3]"
    ],
    cons: [
      "Some correlations found between screen exposure and cognitive delays [3]",
      "May reduce time spent in crucial face-to-face interactions and physical play [1]",
      "Potential impact on sleep patterns and quality [2]"
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
        text: "Screen exposure and infant cognitive development: A scoping review. Infant Behavior and Development, 2023.",
        url: "https://pubmed.ncbi.nlm.nih.gov/36585349/"
      }
    ]
  }
};

export function ExampleQueryDisplay() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            value={exampleData.query}
            readOnly
            className="w-full px-4 py-3 pr-12 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none cursor-default shadow-sm"
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