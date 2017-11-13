const diffBeerList = require('./diff_beer_list');

diffBeerList()
  .then(diff => {
    if (diff.length == 0) {
      console.log(new Date().toString() + ":", "No changes found");
    } else {
      const removes = diff.filter(({op}) => op == 'remove').length;
      const adds = diff.filter(({op}) => op == 'add').length;
      console.log(new Date().toString() + ":", `Changes found: ${adds} added, ${removes} removed`);
    }
  })
  .catch(e => console.error(e));

