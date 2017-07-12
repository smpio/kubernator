import update from 'immutability-helper';
import {
  arrayDelete,
  arrayPushUnique,
  objectDelete,
} from '@uqee/immutability-helper-extensions';

update.extend('$pop', arrayDelete);
update.extend('$pushuniq', arrayPushUnique);
update.extend('$del', objectDelete);
