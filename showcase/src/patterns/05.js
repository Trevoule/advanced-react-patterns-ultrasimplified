import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import mojs from "mo-js";
import styles from "./index.css";
import userCustomStyles from "./usage.css";

const initialState = {
  count: 0,
  countTotal: 267,
  isClicked: false,
};

// Custom Hook for animation
// const initialState = new mojs.Timeline();

const useClapAnimation = ({ clapEl, countEl, clapTotalEl }) => {
  const [animationTimeLine, setAnimationTimeLine] = useState(
    // passing function reference opposed to invoking a function withing useState
    // if regular object will be created each time
    () => new mojs.Timeline()
  );

  // componentDidMount
  useLayoutEffect(() => {
    if (!clapEl || !countEl || !clapTotalEl) return;

    const tlDuration = 300;

    const scaleButton = new mojs.Html({
      el: clapEl,
      duration: tlDuration,
      scale: { 1.3: 1 },
      easing: mojs.easing.ease.out,
    });

    const triangleBurst = new mojs.Burst({
      parent: clapEl,
      radius: { 50: 95 },
      count: 5,
      angle: 30,
      children: {
        shape: "polygon",
        radius: { 6: 0 },
        stroke: "rgba(211,54, 0, 0.5)",
        strokeWidth: 2,
        angle: 210,
        delay: 30,
        speed: 0.2,
        easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
        duration: tlDuration,
      },
    });

    const circleBurst = new mojs.Burst({
      parent: clapEl,
      radius: { 50: 75 },
      count: 5,
      angle: 25,
      duration: tlDuration,
      children: {
        shape: "circle",
        radius: { 3: 0 },
        stroke: "rgba(149,165, 166, 0.5)",
        strokeWidth: 2,
        angle: 210,
        delay: 30,
        speed: 0.2,
        easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
        duration: tlDuration,
      },
    });

    const countTotalAnimation = new mojs.Html({
      el: clapTotalEl,
      opacity: { 0: 1 },
      delay: (3 * tlDuration) / 2,
      duration: tlDuration,
      // slides to top in the end
      y: { 0: -3 },
    });

    const countAnimation = new mojs.Html({
      el: countEl,
      opacity: { 0: 1 },
      delay: (3 * tlDuration) / 2,
      duration: tlDuration,
      // slides to top in the end
      y: { 0: -30 },
    }).then({
      opacity: { 1: 0 },
      delay: tlDuration / 2,
      y: -80,
    });

    // needed to return initial scale after animation replay

    // id
    // const clap = document.getElementById("clap");
    // clap.style.transform = "scale(1, 1)";

    // ref
    if (typeof clapEl === "string") {
      const clap = document.getElementById("clap");
      clap.style.transform = "scale(1, 1)";
    } else {
      clapEl.style.transform = "scale(1, 1)";
    }

    const newAnimationTimeLine = animationTimeLine.add([
      scaleButton,
      countTotalAnimation,
      countAnimation,
      triangleBurst,
      circleBurst,
    ]);
    setAnimationTimeLine(newAnimationTimeLine);
  }, [clapEl, countEl, clapTotalEl]);

  return animationTimeLine;
};

// context
const MediumClapContext = createContext();
const { Provider } = MediumClapContext;

const MediumClap = ({
  children,
  onClap,
  values = null,
  style: userStyles = {},
  className,
}) => {
  const MAXIMUM_USER_CLAP = 50;
  const [clapState, setClapState] = useState(initialState);
  const { count } = clapState;

  const [{ clapRef, clapCountRef, clapTotalRef }, setRefState] = useState({});

  // we need useCallback for action only when deps changing
  const setRef = useCallback((node) => {
    // the fact that we can save state / setState here is a major reason
    //  we're using the callback ref as setting state re-renders
    // the component and forces useClapAnimation to be reinvoked with the received refs.
    setRefState((prevRefState) => ({
      ...prevRefState,
      // data-refKey for specifying each node in setRef
      [node.dataset.refkey]: node,
    }));
  }, []);

  const animationTimeLine = useClapAnimation({
    clapEl: clapRef,
    countEl: clapCountRef,
    clapTotalEl: clapTotalRef,
  });

  // useRef keep track of instance variables across re-renders
  const componentJustMounted = useRef(true);

  //-- controlled component?
  const isControlled = !!values && onClap;

  // simulation of invoking callback
  // every time when count changes it will invoke onClap
  useEffect(() => {
    // will not be invoked due to conditional
    // but useEffect invokes every re-render
    // so we could do additional check to make sure that component mounted after re-render
    // for example after click
    // with these check onClap will not be invoked before re-render (click)

    // --not invoked if component controlled
    if (!componentJustMounted.current && !isControlled) {
      onClap && onClap(clapState);
    }

    componentJustMounted.current = false;
  }, [count, isControlled, onClap]);

  const handleClapClick = () => {
    animationTimeLine.replay();
    isControlled
      ? onClap()
      : setClapState((prevState) => ({
          isClicked: true,
          // return minimumValue among them
          count: Math.min(count + 1, MAXIMUM_USER_CLAP),
          countTotal:
            count < MAXIMUM_USER_CLAP
              ? prevState.countTotal + 1
              : prevState.countTotal,
        }));
  };

  //-- controlled state
  const getState = useCallback(
    () => (isControlled ? values : clapState),
    [isControlled, values, clapState]
  );

  const memoizedValue = useMemo(
    () => ({
      // ...clapState,
      //-- controlled state, spread result!!
      ...getState(),
      setRef,
    }),
    [clapState, values, setRef]
  );

  const classNames = [styles.clap, className].join(" ").trim();

  return (
    // bad approach, because when provider will re-rendered
    // the whole dom tree will be re-rendered as well
    // <Provider value={{ ...clapState, setRef }}>

    // to solve the problem of re-rendering we would need to memoize the value with useMemo
    // clapState is managed by useState and setRef is managed by useCallback

    <Provider value={memoizedValue}>
      <button
        ref={setRef}
        // data-refKey for specifying each node in setRef
        data-refkey="clapRef"
        className={classNames}
        onClick={handleClapClick}
        style={userStyles}
      >
        {children}
        {/* <ClapIcon isClicked={isClicked} />
        <ClapCount count={count} setRef={setRef} />
        <CountTotal countTotal={countTotal} setRef={setRef} /> */}
      </button>
    </Provider>
  );
};

// ===========subcomponents=============

// const ClapIcon = ({ isClicked }) => {
// value from provider
const ClapIcon = ({ style: userStyles = {}, className }) => {
  const { isClicked } = useContext(MediumClapContext);

  const classNames = [styles.icon, isClicked ? styles.checked : "", className]
    .join(" ")
    .trim();

  return (
    <span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-549 338 100.1 125"
        className={classNames}
        style={userStyles}
      >
        <path d="M-471.2 366.8c1.2 1.1 1.9 2.6 2.3 4.1.4-.3.8-.5 1.2-.7 1-1.9.7-4.3-1-5.9-2-1.9-5.2-1.9-7.2.1l-.2.2c1.8.1 3.6.9 4.9 2.2zm-28.8 14c.4.9.7 1.9.8 3.1l16.5-16.9c.6-.6 1.4-1.1 2.1-1.5 1-1.9.7-4.4-.9-6-2-1.9-5.2-1.9-7.2.1l-15.5 15.9c2.3 2.2 3.1 3 4.2 5.3zm-38.9 39.7c-.1-8.9 3.2-17.2 9.4-23.6l18.6-19c.7-2 .5-4.1-.1-5.3-.8-1.8-1.3-2.3-3.6-4.5l-20.9 21.4c-10.6 10.8-11.2 27.6-2.3 39.3-.6-2.6-1-5.4-1.1-8.3z" />
        <path d="M-527.2 399.1l20.9-21.4c2.2 2.2 2.7 2.6 3.5 4.5.8 1.8 1 5.4-1.6 8l-11.8 12.2c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l34-35c1.9-2 5.2-2.1 7.2-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l28.5-29.3c2-2 5.2-2 7.1-.1 2 1.9 2 5.1.1 7.1l-28.5 29.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.4 1.7 0l24.7-25.3c1.9-2 5.1-2.1 7.1-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l14.6-15c2-2 5.2-2 7.2-.1 2 2 2.1 5.2.1 7.2l-27.6 28.4c-11.6 11.9-30.6 12.2-42.5.6-12-11.7-12.2-30.8-.6-42.7m18.1-48.4l-.7 4.9-2.2-4.4m7.6.9l-3.7 3.4 1.2-4.8m5.5 4.7l-4.8 1.6 3.1-3.9" />
      </svg>
    </span>
  );
};

const ClapCount = ({ style: userStyles = {} }, className) => {
  const { count, setRef } = useContext(MediumClapContext);
  const classNames = [styles.count, className].join(" ").trim();

  return (
    <span
      ref={setRef}
      data-refkey="clapCountRef"
      className={classNames}
      style={userStyles}
    >
      + {count}
    </span>
  );
};

const CountTotal = ({ style: userStyles = {} }, className) => {
  const { countTotal, setRef } = useContext(MediumClapContext);

  const classNames = [styles.total, className].join(" ").trim();

  return (
    <span
      ref={setRef}
      data-refkey="clapTotalRef"
      className={classNames}
      style={userStyles}
    >
      {countTotal}
    </span>
  );
};

const INITIAL_STATE = {
  count: 0,
  countTotal: 2100,
  isClicked: false,
};

const MAXIMUM_CLAP_VALUE = 10;

const Usage = () => {
  const [state, setState] = useState(INITIAL_STATE);
  const handleClap = (clapState) => {
    // setCount(clapState.count);
    setState(({ count, countTotal }) => ({
      count: Math.min(count + 1, MAXIMUM_CLAP_VALUE),
      countTotal: count < MAXIMUM_CLAP_VALUE ? countTotal + 1 : countTotal,
      isClicked: true,
    }));
  };

  return (
    <div style={{ width: "100%" }}>
      <MediumClap
        values={state}
        onClap={handleClap}
        className={userCustomStyles.clap}
      >
        <ClapIcon className={userCustomStyles.icon} />
        <ClapCount className={userCustomStyles.count} />
        <CountTotal className={userCustomStyles.total} />
      </MediumClap>
      <MediumClap
        values={state}
        onClap={handleClap}
        className={userCustomStyles.clap}
      >
        <ClapIcon className={userCustomStyles.icon} />
        <ClapCount className={userCustomStyles.count} />
        <CountTotal className={userCustomStyles.total} />
      </MediumClap>
      {!!state.count && (
        <div
          className={styles.info}
        >{`You have clapped ${state.count} times!`}</div>
      )}
    </div>
  );
};

export default Usage;
