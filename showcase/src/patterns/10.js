import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import mojs from "mo-js";
import styles from "./index.css";
import userStyles from "./usage.css";

const INITIAL_STATE = {
  count: 0,
  countTotal: 267,
  isClicked: false,
};

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

/**
 * useDOMRefHook
 */
// these hook recreates logic for targeting nodes via dataset as it was in setRef useState

const useDOMRef = () => {
  // imitating regular behavior of useState
  // [state, setState] = useState(initialState)
  const [DOMRef, setRefState] = useState({});
  const setRef = useCallback((node) => {
    setRefState((prevRefState) => ({
      ...prevRefState,
      [node.dataset.refkey]: node,
    }));
  }, []);
  // DOMRef - state of the refs, holds all the refs
  // setRef - function updater
  return [DOMRef, setRef];
};

/**
 * hook for getting previous prop/state
 *
 */

// value 0, 1
const usePrevious = (value) => {
  const ref = useRef();

  // React doesn’t execute the useEffect call, instead, the current value of the custom Hook is returned
  // The useEffect Hook is invoked only after the component from which it is called has been rendered.
  // Next, the execution within the component resumes. This time, the prevCount variable holds the value undefined
  // To avoid blocking the browser from painting the DOM changes, the useEffect call within the usePrevious Hook is now invoked asynchronously.
  // useEffect is invoked after the functional component renders
  // The line within the useEffect function updates the current property of the ref object to value.
  // value now represents what the custom Hook was initially called with.

  // useEffect never called until the return statement of the func component is reached
  // on value 1 nothing happens until the return statement of the function is executed
  // then useEffect runs and we updated useEffect
  // 1 is not returned anywhere until next invocation when value 2 it returns 1

  // ref stores the value, useEffect is never called
  // until return statment executed
  useEffect(() => {
    ref.current = value; // 2
  });
  return ref.current; // undefined, 0, 1, 2
};

// const handleClick = (evt) => { ... }
// <button onClick={handleClick} />
// for invoking multiple functions curry func
// onClick requires on function callback
// (...fns) first invocation in the func parameters
// (...args) second invocation takes in whatever args are passed in
// loops over the func list and invokes the funcs with the args

const callFnsInSequence =
  (...fns) =>
  (...args) => {
    //   invoking all funcs
    fns.forEach((fn) => fn && fn(...args));
  };

/*
 *  useClapState
 */
const MAXIMUM_USER_CLAP = 50;

// useReducer instead of useState
// deconstruct of previous state
// type deconstruct of action object
const internalReducer = ({ count, countTotal }, { type, payload }) => {
  switch (type) {
    case "clap":
      return {
        isClicked: true,
        count: Math.min(count + 1, MAXIMUM_USER_CLAP),
        countTotal: count < MAXIMUM_USER_CLAP ? countTotal + 1 : countTotal,
      };
    case "reset":
      return payload;
    default:
      break;
  }
};
const useClapState = (
  initialState = INITIAL_STATE,
  reducer = internalReducer
) => {
  const userInitialState = useRef(initialState);

  //   const [clapState, setClapState] = useState(initialState);
  const [clapState, dispatch] = useReducer(reducer, initialState);

  const { count, countTotal } = clapState;

  // useCallback  not needed as its not passed to the user but invoked in callFnsInSequence
  //   so it's reference does not change
  const updateClapState = () => dispatch({ type: "clap" });
  //   const updateClapState = useCallback(() => {
  // setClapState(({ count, countTotal }) => ({
  //   isClicked: true,
  //   count: Math.min(count + 1, MAXIMUM_USER_CLAP),
  //   countTotal: count < MAXIMUM_USER_CLAP ? countTotal + 1 : countTotal,
  // }));
  //   }, []);

  // glorified counter
  const resetRef = useRef(0); //0, 1, 2, 3, 4

  // usePrevious hook docs
  const prevCount = usePrevious(count);

  const reset = useCallback(() => {
    //   if there is an actual change go and reset
    // but if nothing to reset dont do anything
    if (prevCount !== count) {
      // by using ref we don't need to provide dependency
      //   setClapState(userInitialState.current);
      dispatch({ type: "reset", payload: userInitialState.current });

      resetRef.current++;
    }
    //   }, [prevCount, count, setClapState]);
  }, [prevCount, count]);

  // accessibility props
  // props collection for 'click'
  const getTogglerProps = ({ onClick, ...otherProps } = {}) => ({
    onClick: callFnsInSequence(updateClapState, onClick),
    "aria-pressed": clapState.isClicked,
    ...otherProps,
  });

  // props collection for 'count'
  const getCounterProps = ({ ...otherProps }) => ({
    count,
    "aria-valuemax": MAXIMUM_USER_CLAP,
    "aria-valuemin": 0,
    "aria-valuenow": count,
    ...otherProps,
  });

  return {
    clapState,
    updateClapState,
    getTogglerProps,
    getCounterProps,
    reset,
    resetDeps: resetRef.current,
  };
};

// adding internal reducer
useClapState.reducer = internalReducer;
useClapState.types = {
  clap: "clap",
  reset: "reset",
};

/**
 * useEffectAfterMount
 */
// instead of useEffect and handleClapClick

const useEffectAfterMount = (cb, deps) => {
  const componentJustMounted = useRef(true);

  useEffect(() => {
    if (!componentJustMounted.current) {
      return cb();
    }

    componentJustMounted.current = false;
  }, [...deps]);
};

// ===========subcomponents=============

const ClapContainer = ({ children, setRef, updateClapState, ...restProps }) => {
  return (
    <button
      ref={setRef}
      // data-refkey="clapRef"
      className={styles.clap}
      onClick={updateClapState}
      {...restProps}
    >
      {children}
    </button>
  );
};

const ClapIcon = ({ isClicked }) => {
  return (
    <span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-549 338 100.1 125"
        className={`${styles.icon} ${isClicked && styles.checked}`}
      >
        <path d="M-471.2 366.8c1.2 1.1 1.9 2.6 2.3 4.1.4-.3.8-.5 1.2-.7 1-1.9.7-4.3-1-5.9-2-1.9-5.2-1.9-7.2.1l-.2.2c1.8.1 3.6.9 4.9 2.2zm-28.8 14c.4.9.7 1.9.8 3.1l16.5-16.9c.6-.6 1.4-1.1 2.1-1.5 1-1.9.7-4.4-.9-6-2-1.9-5.2-1.9-7.2.1l-15.5 15.9c2.3 2.2 3.1 3 4.2 5.3zm-38.9 39.7c-.1-8.9 3.2-17.2 9.4-23.6l18.6-19c.7-2 .5-4.1-.1-5.3-.8-1.8-1.3-2.3-3.6-4.5l-20.9 21.4c-10.6 10.8-11.2 27.6-2.3 39.3-.6-2.6-1-5.4-1.1-8.3z" />
        <path d="M-527.2 399.1l20.9-21.4c2.2 2.2 2.7 2.6 3.5 4.5.8 1.8 1 5.4-1.6 8l-11.8 12.2c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l34-35c1.9-2 5.2-2.1 7.2-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l28.5-29.3c2-2 5.2-2 7.1-.1 2 1.9 2 5.1.1 7.1l-28.5 29.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.4 1.7 0l24.7-25.3c1.9-2 5.1-2.1 7.1-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l14.6-15c2-2 5.2-2 7.2-.1 2 2 2.1 5.2.1 7.2l-27.6 28.4c-11.6 11.9-30.6 12.2-42.5.6-12-11.7-12.2-30.8-.6-42.7m18.1-48.4l-.7 4.9-2.2-4.4m7.6.9l-3.7 3.4 1.2-4.8m5.5 4.7l-4.8 1.6 3.1-3.9" />
      </svg>
    </span>
  );
};

const ClapCount = ({ count, setRef, ...restProps }) => {
  return (
    <span
      ref={setRef}
      //data-refkey="clapCountRef"
      className={styles.count}
      {...restProps}
    >
      + {count}
    </span>
  );
};

const CountTotal = ({ countTotal, setRef, ...restProps }) => {
  return (
    <span
      ref={setRef}
      //data-refkey="clapTotalRef"
      className={styles.total}
      {...restProps}
    >
      {countTotal}
    </span>
  );
};

// - custom hooks
// - UI components
const userInitialState = {
  count: 0,
  countTotal: 1000,
  isClicked: false,
};

const Usage = () => {
  const [timesClapped, setTimesClapped] = useState(0);
  const isClappedTooMuch = timesClapped >= 7; // true/false

  // for creating our custom reducer we need internal reducer and types
  const reducer = (state, action) => {
    if (action.type === useClapState.types.clap && isClappedTooMuch) {
      return state;
    }

    return useClapState.reducer(state, action);
  };

  const {
    clapState,
    updateClapState,
    getTogglerProps,
    getCounterProps,
    reset,
    resetDeps,
  } = useClapState(userInitialState, reducer);
  const { count, countTotal, isClicked } = clapState;

  const [{ clapRef, clapCountRef, clapTotalRef }, setRef] = useDOMRef();

  const animationTimeLine = useClapAnimation({
    clapEl: clapRef,
    countEl: clapCountRef,
    clapTotalEl: clapTotalRef,
  });

  useEffectAfterMount(() => {
    animationTimeLine.replay();
  }, [count]);

  const [uploading, setUploading] = useState(false);

  useEffectAfterMount(() => {
    setUploading(true);
    setTimesClapped(0);

    const id = setTimeout(() => setUploading(false), 3000);

    return () => clearTimeout(id);
  }, [resetDeps]);

  const handleClick = () => {
    setTimesClapped((prev) => prev + 1);
  };
  return (
    <div>
      <ClapContainer
        setRef={setRef}
        data-refkey="clapRef"
        //   onClick={togglerProps}
        {...getTogglerProps({
          onClick: handleClick,
          "aria-pressed": "false",
        })}
      >
        <ClapIcon isClicked={isClicked} />
        <ClapCount
          setRef={setRef}
          data-refkey="clapCountRef"
          // count={counterProps}
          {...getCounterProps()}
        />
        <CountTotal
          countTotal={countTotal}
          setRef={setRef}
          data-refkey="clapTotalRef"
        />
      </ClapContainer>
      <section>
        <button onClick={reset} className={userStyles.resetBtn}>
          reset
        </button>
        <pre className={userStyles.resetMsg}>
          {JSON.stringify({ timesClapped, count, countTotal })}
        </pre>
        <pre className={userStyles.resetMsg}>
          {uploading ? `uploading reset ${resetDeps} ...` : ""}
        </pre>
        <pre style={{ color: "red" }}>
          {isClappedTooMuch ? "You have clapped too much" : ""}
        </pre>
      </section>
    </div>
  );
};

export default Usage;
