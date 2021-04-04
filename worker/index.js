const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
// Making these duplicates -> according the redis
// documentation for this js library, if we every have a
// client that's listening or publishing information on redis
// we have to make a duplicate connection because when
// a connection is turned into a connection that is going
// to listen, subscribe or publish information if cannot be used
// for other purposes.
const sub = redisClient.duplicate();

function fib(index) {
  if(index <2) return 1;
  return fib(index -1) + fib(index -2);
}

sub.on('message', (channel, message) => {
  redisClient.hset('values', message, fib(parseInt(message)))
});
sub.subscribe('insert');