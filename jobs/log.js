function(data, clb) {
  console.log(JSON.stringify(data, null, 2));
  clb(data);
}
