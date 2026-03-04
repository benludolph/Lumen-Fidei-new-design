import answerCorrectUrl from "@assets/Answer_Correct_1772555574960.wav";
import wrongAnswerUrl from "@assets/Wrong_Answer_1772557340180.wav";
import lessonCompleteUrl from "@assets/Lesson_Complete_1772555574975.wav";
import clickContinueUrl from "@assets/Click_Continue_1772555574975.wav";
import timerCompleteUrl from "@assets/Unrealsfx_-_Building_Game_UI_-_Pop_Up_Message_Inviting_1772562554662.wav";
import sendMessageUrl from "@assets/Sending_a_Message_1772567972547.wav";

const volumes: Record<string, number> = {
  [answerCorrectUrl]: 0.5,
  [wrongAnswerUrl]: 0.5,
  [lessonCompleteUrl]: 0.5,
  [clickContinueUrl]: 0.25,
  [timerCompleteUrl]: 0.5,
  [sendMessageUrl]: 0.5,
};

const audioBuffers: Record<string, HTMLAudioElement> = {};

function ensureBuffer(url: string): HTMLAudioElement {
  if (!audioBuffers[url]) {
    const audio = new Audio(url);
    audio.preload = "auto";
    audio.load();
    audioBuffers[url] = audio;
  }
  return audioBuffers[url];
}

Object.keys(volumes).forEach(ensureBuffer);

function play(url: string) {
  try {
    const vol = volumes[url] ?? 0.5;
    const clone = ensureBuffer(url).cloneNode(true) as HTMLAudioElement;
    clone.volume = vol;
    clone.play().catch(() => {});
    clone.addEventListener("ended", () => {
      clone.remove();
    });
  } catch {}
}

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

export function playSendMessage() {
  play(sendMessageUrl);
}
