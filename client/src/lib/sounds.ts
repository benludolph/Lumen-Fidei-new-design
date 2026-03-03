import answerCorrectUrl from "@assets/Answer_Correct_1772555574960.wav";
import wrongAnswerUrl from "@assets/Wrong_Answer_1772557340180.wav";
import lessonCompleteUrl from "@assets/Lesson_Complete_1772555574975.wav";
import clickContinueUrl from "@assets/Click_Continue_1772555574975.wav";
import timerCompleteUrl from "@assets/Unrealsfx_-_Building_Game_UI_-_Pop_Up_Message_Inviting_1772562554662.wav";

const preloaded: Record<string, HTMLAudioElement> = {};

function preload(url: string, volume = 0.5): HTMLAudioElement {
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.volume = volume;
  audio.load();
  return audio;
}

function play(url: string) {
  try {
    let audio = preloaded[url];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      audio = preload(url);
      preloaded[url] = audio;
      audio.play().catch(() => {});
    }
  } catch {}
}

preloaded[answerCorrectUrl] = preload(answerCorrectUrl);
preloaded[wrongAnswerUrl] = preload(wrongAnswerUrl);
preloaded[lessonCompleteUrl] = preload(lessonCompleteUrl);
preloaded[clickContinueUrl] = preload(clickContinueUrl, 0.25);
preloaded[timerCompleteUrl] = preload(timerCompleteUrl);

export function playAnswerCorrect() {
  play(answerCorrectUrl);
}

export function playWrongAnswer() {
  play(wrongAnswerUrl);
}

export function playLessonComplete() {
  play(lessonCompleteUrl);
}

export function playClickContinue() {
  play(clickContinueUrl);
}

export function playTimerComplete() {
  play(timerCompleteUrl);
}
