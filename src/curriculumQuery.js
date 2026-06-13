// curriculumQuery.js — single seam over syllabusData
// All callers use these functions; none access syllabusData internals directly.
window.CurriculumQuery = (function () {
  'use strict';

  const _prereqs = {
    'a2': ['a1'], 'a3': ['a2'],
    'b1': ['a1'], 'b2': ['b1', 'a3'], 'b3': ['b2'],
    'c1': ['b1'], 'c2': ['c1'], 'c3': ['c2'],
    'd1': ['c1'], 'd2': ['d1', 'c3'], 'd3': ['d2'],
    'e1': ['b3'], 'e2': ['e1'], 'e3': ['e2', 'c2'],
    'f1': ['e3'], 'f2': ['f1', 'd3'], 'f3': ['f2', 'c3']
  };

  return {
    getTopic: id => syllabusData.topics.find(t => t.id === id) || null,
    getSubject: letter => syllabusData.subjects[letter] || null,
    getDeliverable: id => (syllabusData.deliverables && syllabusData.deliverables[id]) || null,
    allTopics: () => syllabusData.topics,
    getPrereqs: id => _prereqs[id] || [],
  };
})();
