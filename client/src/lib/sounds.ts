import answerCorrectUrl from "@assets/Answer_Correct_1772555574960.wav";
import lessonCompleteUrl from "@assets/Lesson_Complete_1772555574975.wav";
import clickContinueUrl from "@assets/Click_Continue_1772555574975.wav";

function play(url: string) {
  try {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {}
}

export function playAnswerCorrect() {
  play(answerCorrectUrl);
}

export function playLessonComplete() {
  play(lessonCompleteUrl);
}

export function playClickContinue() {
  play(clickContinueUrl);
}
