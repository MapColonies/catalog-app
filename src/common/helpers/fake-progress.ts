export const fakeProgress = (durationInMs: number, progress: (fakePercent: number) => void) => {
  const startTime = performance.now();

  const timer = setInterval(() => {
    const passedTimeFromTheBeginning = performance.now() - startTime;
    const ratioOfPassedTime = Math.min(passedTimeFromTheBeginning / durationInMs, 1);

    // Fast-start easing: (1 - (1 - x)^2) slows down towards the end
    const fakePercent = Math.floor((1 - Math.pow(1 - ratioOfPassedTime, 2)) * 95);
    progress(fakePercent);

    if (fakePercent >= 95) {
      clearInterval(timer);
    }
  }, 200);
  return () => clearInterval(timer);
};
