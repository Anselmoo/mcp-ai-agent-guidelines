import asyncio
import asyncio
import unittest
import demo_code_analysis as demo


class DemoAnalysisTests(unittest.TestCase):
    def test_process_user_data_empty(self):
        self.assertEqual(demo.process_user_data([]), [])

    def test_safe_eval_literal(self):
        self.assertEqual(demo.safe_eval_literal("[1, 2, 3]"), [1, 2, 3])
        self.assertIsNone(demo.safe_eval_literal("__import__('os').getcwd()"))

    def test_increment_shared_counter(self):
        # run increment in a thread and check value increased
        import threading

        # capture initial value
        with demo.SHARED_COUNTER_LOCK:
            start = demo.SHARED_COUNTER

        t = threading.Thread(target=demo.increment_shared_counter, args=(100,))
        t.start()
        t.join()

        with demo.SHARED_COUNTER_LOCK:
            self.assertGreaterEqual(demo.SHARED_COUNTER, start + 100)


if __name__ == "__main__":
    unittest.main()
