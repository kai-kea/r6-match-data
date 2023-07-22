import { ref, Ref } from 'vue';

export default function (numerator: number, denominator: number): Ref<number> {
  if (numerator === 0 || denominator === 0) {
    return ref(0);
  }
  
  return ref(numerator / denominator);
}